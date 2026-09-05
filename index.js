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

// Anti-Delete External Plugin Require කරගැනීම
let antiDeletePlugin = null;
try {
    antiDeletePlugin = require('./plugins/antidelete');
} catch (e) {
    console.log("⚠️ AntiDelete plugin not found in ./plugins/antidelete.js");
}

// Global Anti-Delete State
if (typeof global.antiDeleteEnabled === 'undefined') {
    global.antiDeleteEnabled = true;
}

// 1. External Plugins Load කිරීම
const events = require('./command');
const pluginsDir = path.join(__dirname, 'plugins');
if (fs.existsSync(pluginsDir)) {
    fs.readdirSync(pluginsDir).forEach((plugin) => {
        if (path.extname(plugin).toLowerCase() === '.js' && plugin !== 'welcome.js' && plugin !== 'antidelete.js') {
            try {
                require(path.join(pluginsDir, plugin));
            } catch (err) {
                console.log(`❌ Plugin Load Error [${plugin}]:`, err.message);
            }
        }
    });
}

// Helper Function: Profile Picture එක Base64 Data URI බවට හැරවීම
async function getProfilePicBase64(bot, jid) {
    try {
        const ppUrl = await bot.profilePictureUrl(jid, 'image');
        if (!ppUrl) return 'https://i.ibb.co/6BRM12f/avatar-contact.png';
        
        const response = await fetch(ppUrl);
        if (!response.ok) return 'https://i.ibb.co/6BRM12f/avatar-contact.png';
        
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const mimeType = response.headers.get('content-type') || 'image/jpeg';
        
        return `data:${mimeType};base64,${buffer.toString('base64')}`;
    } catch (e) {
        return 'https://i.ibb.co/6BRM12f/avatar-contact.png';
    }
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
            console.log(`🔄 Connecting to WhatsApp [Session: ${sessionId}]...`);
        } else if (connection === 'close') {
            const statusCode = (lastDisconnect?.error)?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

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

    // -------------------------------------------------------------
    // 👋 1. GROUP WELCOME EVENT ENGINE
    // -------------------------------------------------------------
    rememberBot.ev.on('group-participants.update', async (update) => {
        try {
            const { id, participants, action } = update;
            if (!id || !id.endsWith('@g.us')) return;

            if (action === 'add') {
                for (let num of participants) {
                    const userJid = num;
                    const userName = `@${userJid.split('@')[0]}`;

                    let groupName = "Group";
                    let memberCount = "1+";
                    try {
                        const groupMetadata = await rememberBot.groupMetadata(id);
                        groupName = groupMetadata.subject || "Group";
                        memberCount = groupMetadata.participants ? groupMetadata.participants.length : "1+";
                    } catch (e) {}

                    const ppUserBase64 = await getProfilePicBase64(rememberBot, userJid);

                    const welcomeImgUrl = `https://api.popcat.xyz/welcomecard?background=https://i.ibb.co/4M34dqb/wallpaper.jpg&text1=${encodeURIComponent(userJid.split('@')[0])}&text2=Welcome+To+${encodeURIComponent(groupName)}&text3=Member+${memberCount}&avatar=${encodeURIComponent(ppUserBase64)}`;

                    const welcomeText = `👋 *WELCOME TO THE GROUP!* 👋\n\n` +
                                        `👤 *User:* ${userName}\n` +
                                        `🏰 *Group:* ${groupName}\n` +
                                        `🔢 *Member Count:* #${memberCount}\n\n` +
                                        `> Powered by REMEMBER-MD`;

                    await rememberBot.sendMessage(id, {
                        image: { url: welcomeImgUrl },
                        caption: welcomeText,
                        mentions: [userJid]
                    });
                }
            }
        } catch (err) {
            console.log("Welcome Event Error:", err.message);
        }
    });

    // -------------------------------------------------------------
    // 🗑️ 2. ANTI-DELETE ENGINE (Media & Text Recovery)
    // -------------------------------------------------------------
    rememberBot.ev.on('messages.update', async (updates) => {
        try {
            if (global.antiDeleteEnabled === false) return;
            if (antiDeletePlugin && typeof antiDeletePlugin.onDelete === 'function') {
                await antiDeletePlugin.onDelete(rememberBot, updates);
            }
        } catch (e) {
            console.log("Anti-Delete Protocol Error:", e.message);
        }
    });

    // -------------------------------------------------------------
    // 💬 3. MAIN MESSAGE & COMMAND HANDLER
    // -------------------------------------------------------------
    rememberBot.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const mek = chatUpdate.messages[0];
            if (!mek || !mek.message) return;

            // Media & Text Caching via Anti-Delete Plugin
            if (antiDeletePlugin && typeof antiDeletePlugin.onMessage === 'function') {
                await antiDeletePlugin.onMessage(rememberBot, mek);
            }

            const msgId = mek.key.id;
            if (processedMessages.has(msgId)) return;
            processedMessages.add(msgId);
            setTimeout(() => processedMessages.delete(msgId), 60000);

            const from = mek.key.remoteJid;
            const isGroup = from.endsWith('@g.us');
            const sender = isGroup ? (mek.key.participant || mek.key.remoteJid) : mek.key.remoteJid;
            
            const type = Object.keys(mek.message)[0];
            const msg = type === 'viewOnceMessage' ? mek.message.viewOnceMessage.message : mek.message;
            
            const body = msg.conversation || 
                         msg.extendedTextMessage?.text || 
                         msg.imageMessage?.caption || 
                         msg.videoMessage?.caption || 
                         msg.documentMessage?.caption || 
                         msg.documentMessage?.fileName || '';

            const pushname = mek.pushName || "User";
            const reply = (text) => rememberBot.sendMessage(from, { text }, { quoted: mek });

            // Group Metadata & Admin Checks
            let isBotAdmin = false;
            let isGroupAdmin = false;
            if (isGroup) {
                try {
                    const groupMetadata = await rememberBot.groupMetadata(from);
                    const participants = groupMetadata.participants || [];
                    
                    const rawBotId = rememberBot.user?.id || rememberBot.user?.jid || '';
                    const botJid = rawBotId.split(':')[0].split('@')[0] + '@s.whatsapp.net';
                    
                    const botAdminObj = participants.find(p => p.id.split(':')[0].split('@')[0] + '@s.whatsapp.net' === botJid);
                    isBotAdmin = botAdminObj ? (botAdminObj.admin === 'admin' || botAdminObj.admin === 'superadmin') : false;

                    const cleanSender = sender.split(':')[0].split('@')[0] + '@s.whatsapp.net';
                    const senderObj = participants.find(p => p.id.split(':')[0].split('@')[0] + '@s.whatsapp.net' === cleanSender);
                    isGroupAdmin = senderObj ? (senderObj.admin === 'admin' || senderObj.admin === 'superadmin') : false;
                } catch (e) {
                    isBotAdmin = false;
                    isGroupAdmin = false;
                }
            }

            // Command Processing
            if (body && body.startsWith('.')) {
                const args = body.trim().split(/ +/).slice(1);
                const commandName = body.slice(1).split(" ")[0].toLowerCase();
                const q = args.join(" ");

                const cmd = events.commands.find((c) => 
                    c.pattern === commandName || (c.alias && c.alias.includes(commandName))
                );

                if (cmd) {
                    cmd.function(rememberBot, mek, mek, { 
                        from, 
                        reply, 
                        body, 
                        args, 
                        q, 
                        pushname, 
                        quoted: mek,
                        isCmd: true,
                        command: commandName,
                        isGroup,
                        sender,
                        isBotAdmin,
                        isGroupAdmin
                    });
                }
            }

        } catch (e) {
            console.log(`Message Handler Error [${sessionId}]:`, e);
        }
    });
}

// 4. Dynamic Session Checker
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

// 5. Main Launcher
async function startAllBots() {
    const mongoUri = process.env.MONGODB; 
    if (!mongoUri) return console.log("❌ MONGODB Variable is missing!");

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
