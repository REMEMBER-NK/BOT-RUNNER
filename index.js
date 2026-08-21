const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const pino = require('pino');
const express = require('express');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 8080;

const activeRunningSessions = new Set();
let cachedVersion = null;

// 1. Plugins Load කිරීම
const events = require('./command');
const pluginsDir = path.join(__dirname, 'plugins');
if (fs.existsSync(pluginsDir)) {
    fs.readdirSync(pluginsDir).forEach((plugin) => {
        if (path.extname(plugin).toLowerCase() === '.js') {
            require(path.join(pluginsDir, plugin));
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
        syncFullHistory: false
    });

    rememberBot.ev.on('creds.update', saveCreds);

    rememberBot.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        
        if (connection === 'connecting') {
            console.log(`🔄 Connecting to WhatsApp [Session: ${sessionId}]...`);
        } else if (connection === 'close') {
            const statusCode = (lastDisconnect?.error)?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
            
            console.log(`[Session: ${sessionId}] Connection closed. Reason: ${statusCode}. Reconnecting: ${shouldReconnect}`);

            if (statusCode === DisconnectReason.loggedOut) {
                console.log(`❌ Session Logged Out [${sessionId}]. Cleaning...`);
                activeRunningSessions.delete(sessionId);
                if (fs.existsSync(sessionDir)) fs.rmSync(sessionDir, { recursive: true, force: true });
                await mongoose.connection.db.collection('sessions').deleteOne({ id: sessionId });
            } else if (shouldReconnect) {
                setTimeout(() => startSingleBotInstance(sessionId, sessionData, version), 3000);
            }
        } else if (connection === 'open') {
            console.log(`✅ REMEMBER-MD Connected Successfully for [${sessionId}]!`);
        }
    });

    // Message / Command Handler (Fixed Message Reading)
    rememberBot.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const mek = chatUpdate.messages[0];
            if (!mek || !mek.message) return;

            // Bot තමන් විසින්ම යවන messages skip කිරීම
            if (mek.key.fromMe) return;

            const from = mek.key.remoteJid;
            
            // Message Body එක නිවැරදිව ගන්නා ක්‍රමය (Ephemeral, Image/Video Captions ඇතුළුව)
            const type = Object.keys(mek.message)[0];
            const msg = type === 'viewOnceMessage' ? mek.message.viewOnceMessage.message : mek.message;
            
            const body = msg.conversation || 
                         msg.extendedTextMessage?.text || 
                         msg.imageMessage?.caption || 
                         msg.videoMessage?.caption || '';

            const pushname = mek.pushName || "User";

            console.log(`[${sessionId}] Received Message: "${body}" from ${pushname}`);

            if (body.startsWith('.')) {
                const args = body.trim().split(/ +/).slice(1);
                const commandName = body.slice(1).split(" ")[0].toLowerCase();
                const q = args.join(" ");

                const cmd = events.commands.find((c) => 
                    c.pattern === commandName || (c.alias && c.alias.includes(commandName))
                );

                if (cmd) {
                    const reply = (text) => rememberBot.sendMessage(from, { text }, { quoted: mek });
                    cmd.function(rememberBot, mek, mek, { 
                        from, 
                        reply, 
                        body, 
                        args, 
                        q, 
                        pushname, 
                        quoted: mek,
                        isCmd: true,
                        command: commandName
                    });
                }
            }
        } catch (e) {
            console.log(`Message Handler Error [${sessionId}]:`, e);
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
                console.log(`🚀 New Session Detected: [${sessionId}]. Auto-Starting Bot...`);
                activeRunningSessions.add(sessionId);
                await startSingleBotInstance(sessionId, sessionData, cachedVersion);
            }
        }
    } catch (e) {
        console.log("⚠️ Error checking sessions from DB:", e.message);
    }
}

// 4. Main Master Launcher
async function startAllBots() {
    const mongoUri = process.env.MONGODB; 
    if (!mongoUri) return console.log("❌ MONGODB Variable is missing in Railway!");

    try {
        await mongoose.connect(mongoUri);
        console.log("✅ Mongoose Connected Successfully!");
        
        await checkForNewSessions();

        setInterval(() => {
            checkForNewSessions();
        }, 15000);

    } catch (err) {
        return console.log("❌ DB Connection Error:", err);
    }
}

app.get('/', (req, res) => res.send('REMEMBER-MD Multi-Bot Runner Active!'));
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

startAllBots();
