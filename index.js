const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const pino = require('pino');
const express = require('express');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 8080;

const activeRunningSessions = new Set();
const processedMessages = new Set();
let cachedVersion = null;

// 🧠 Message Memory Store (Antidelete)
const msgStore = new Map();

// 1. Plugins Load
const events = require('./command');
const pluginsDir = path.join(__dirname, 'plugins');
if (fs.existsSync(pluginsDir)) {
    fs.readdirSync(pluginsDir).forEach((plugin) => {
        const lowerPlugin = plugin.toLowerCase();
        if (path.extname(plugin).toLowerCase() === '.js' && lowerPlugin !== 'welcome.js' && lowerPlugin !== 'anti_delete.js' && lowerPlugin !== 'antidelete.js') {
            try {
                require(path.join(pluginsDir, plugin));
            } catch (err) {
                console.log(`❌ Plugin Load Error [${plugin}]:`, err.message);
            }
        }
    });
}

// 2. Single Bot Instance Starter
async function startSingleBotInstance(sessionId, sessionData, version) {
    const sessionDir = path.join(__dirname, 'sessions', sessionId);
    if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });

    fs.writeFileSync(path.join(sessionDir, 'creds.json'), JSON.stringify(sessionData, null, 2));

    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

    const rememberBot = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        browser: ['REMEMBER-MD', 'Chrome', '1.0.0'],
        auth: state,
        version,
        syncFullHistory: false,
        markOnlineOnConnect: true
    });

    rememberBot.ev.on('creds.update', saveCreds);

    rememberBot.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'connecting') {
            console.log(`🔄 Connecting WhatsApp [Session: ${sessionId}]...`);
        } else if (connection === 'close') {
            const statusCode = (lastDisconnect?.error)?.output?.statusCode;
            if (statusCode === DisconnectReason.loggedOut) {
                activeRunningSessions.delete(sessionId);
                if (fs.existsSync(sessionDir)) fs.rmSync(sessionDir, { recursive: true, force: true });
                await mongoose.connection.db.collection('sessions').deleteOne({ id: sessionId });
            } else {
                setTimeout(() => startSingleBotInstance(sessionId, sessionData, version), 3000);
            }
        } else if (connection === 'open') {
            console.log(`✅ Connected Successfully [Session: ${sessionId}]!`);
        }
    });

    // 👋 1. GROUP WELCOME ENGINE (Simple Direct Text to Test)
    rememberBot.ev.on('group-participants.update', async (update) => {
        try {
            console.log("👥 Participant Event Triggered:", update); // Debug Log
            const { id, participants, action } = update;
            if (!id || !id.endsWith('@g.us')) return;

            if (action === 'add') {
                for (let num of participants) {
                    const userName = `@${num.split('@')[0]}`;
                    const welcomeText = `👋 *WELCOME TO THE GROUP!*\n\n` +
                                        `👤 *User:* ${userName}\n` +
                                        `🏰 *Group:* Welcome to our chat!\n\n` +
                                        `> Powered by REMEMBER-MD`;

                    await rememberBot.sendMessage(id, { text: welcomeText, mentions: [num] });
                }
            }
        } catch (err) {
            console.log("Welcome Event Error:", err);
        }
    });

    // 💬 2. MESSAGE & ANTI-DELETE ENGINE
    rememberBot.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const mek = chatUpdate.messages[0];
            if (!mek || !mek.message) return;

            const msgId = mek.key.id;
            const from = mek.key.remoteJid;

            // 🛑 Protocol Message Detect (Delete for Everyone Capture)
            const type = Object.keys(mek.message)[0];
            if (type === 'protocolMessage' && mek.message.protocolMessage.type === 0) {
                const deletedKey = mek.message.protocolMessage.key;
                const storedMsg = msgStore.get(deletedKey.id);

                if (storedMsg) {
                    const deleter = mek.key.participant || mek.key.remoteJid || from;
                    const deletedText = `⚠️ *DELETED MESSAGE DETECTED!* ⚠️\n\n👤 *Deleted By:* @${deleter.split('@')[0]}`;

                    await rememberBot.sendMessage(from, { text: deletedText, mentions: [deleter] });
                    await rememberBot.sendMessage(from, { forward: storedMsg }, { quoted: storedMsg });
                    msgStore.delete(deletedKey.id);
                }
                return;
            }

            // 💾 Normal Message Store (Save to Memory)
            if (!mek.key.fromMe) {
                msgStore.set(msgId, mek);
                // Keep last 500 messages
                if (msgStore.size > 500) {
                    const firstKey = msgStore.keys().next().value;
                    msgStore.delete(firstKey);
                }
            }

            if (processedMessages.has(msgId)) return;
            processedMessages.add(msgId);
            setTimeout(() => processedMessages.delete(msgId), 60000);

            const isGroup = from.endsWith('@g.us');
            const sender = isGroup ? (mek.key.participant || mek.key.remoteJid) : mek.key.remoteJid;
            const msg = type === 'viewOnceMessage' ? mek.message.viewOnceMessage.message : mek.message;
            
            const body = msg.conversation || 
                         msg.extendedTextMessage?.text || 
                         msg.imageMessage?.caption || 
                         msg.videoMessage?.caption || 
                         msg.documentMessage?.caption || '';

            const pushname = mek.pushName || "User";
            const reply = (text) => rememberBot.sendMessage(from, { text }, { quoted: mek });

            // Command Engine
            if (body && body.startsWith('.')) {
                const args = body.trim().split(/ +/).slice(1);
                const commandName = body.slice(1).split(" ")[0].toLowerCase();
                const cmd = events.commands.find((c) => c.pattern === commandName || (c.alias && c.alias.includes(commandName)));

                if (cmd) {
                    cmd.function(rememberBot, mek, mek, { from, reply, body, args, pushname, isGroup, sender });
                }
            }

        } catch (e) {
            console.log(`Message Error:`, e);
        }
    });
}

// 3. Dynamic Session Checker
async function checkForNewSessions() {
    try {
        if (mongoose.connection.readyState !== 1) return;
        if (!cachedVersion) {
            const { version } = await fetchLatestBaileysVersion();
            cachedVersion = version;
        }

        const docs = await mongoose.connection.db.collection('sessions').find({}).toArray();

        for (let doc of docs) {
            const sessionId = doc.id || `session_${doc._id}`;
            const sessionData = doc.creds || doc.sessionData;

            if (sessionData && !activeRunningSessions.has(sessionId)) {
                activeRunningSessions.add(sessionId);
                await startSingleBotInstance(sessionId, sessionData, cachedVersion);
            }
        }
    } catch (e) {
        console.log("DB Session Error:", e.message);
    }
}

// 4. Main Launcher
async function startAllBots() {
    const mongoUri = process.env.MONGODB; 
    if (!mongoUri) return console.log("❌ MONGODB Variable missing!");

    try {
        await mongoose.connect(mongoUri);
        console.log("✅ Mongoose Connected!");
        await checkForNewSessions();
        setInterval(checkForNewSessions, 15000);
    } catch (err) {
        console.log("❌ DB Error:", err);
    }
}

app.get('/', (req, res) => res.send('REMEMBER-MD Multi-Bot Runner Active!'));
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

startAllBots();
