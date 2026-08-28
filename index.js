const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const pino = require('pino');
const express = require('express');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 8080;

const activeRunningSessions = new Set();
const processedMessages = new Set(); // Duplicate Messages Block කරන Cache එක
let cachedVersion = null;

// TAHANAM WACHANA (BAD WORDS LIST)
const BAD_WORDS = [
    "puka", "paka", "htt", "hukana", "huththa", "kari", "ponnaya", "hukapan", "hukano", "pakaya", "ponna", "hutho", "huththo"
];

// User Warnings Tracker (In-Memory)
const userWarnings = new Map();

// 1. Plugins Load කිරීම
const events = require('./command');
const pluginsDir = path.join(__dirname, 'plugins');
if (fs.existsSync(pluginsDir)) {
    fs.readdirSync(pluginsDir).forEach((plugin) => {
        if (path.extname(plugin).toLowerCase() === '.js') {
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

    // Message Handler & Warning System Engine
    rememberBot.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const mek = chatUpdate.messages[0];
            if (!mek || !mek.message) return;

            // Duplicate Message Check
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
                         msg.videoMessage?.caption || '';

            const pushname = mek.pushName || "User";
            const reply = (text) => rememberBot.sendMessage(from, { text }, { quoted: mek });

            // Group Metadata Check
            let isBotAdmin = false;
            let isGroupAdmin = false;
            if (isGroup) {
                try {
                    const groupMetadata = await rememberBot.groupMetadata(from);
                    const participants = groupMetadata.participants || [];
                    
                    const botNumber = rememberBot.user.id.split(':')[0] + '@s.whatsapp.net';
                    const botAdminObj = participants.find(p => p.id === botNumber);
                    isBotAdmin = !!botAdminObj?.admin;

                    const senderObj = participants.find(p => p.id === sender);
                    isGroupAdmin = !!senderObj?.admin;
                } catch (e) {
                    isBotAdmin = false;
                    isGroupAdmin = false;
                }
            }

            // =======================================================
            // 🚨 BAD-WORD FILTER WITH 3-WARNING SYSTEM
            // =======================================================
            if (isGroup && body) {
                const containsBadWord = BAD_WORDS.some(word => body.toLowerCase().includes(word));

                if (containsBadWord) {
                    try {
                        // 1. Delete Bad Word Message
                        await rememberBot.sendMessage(from, { delete: mek.key });

                        // 2. Count Warnings
                        let currentWarns = (userWarnings.get(sender) || 0) + 1;
                        userWarnings.set(sender, currentWarns);

                        const username = `@${sender.split('@')[0]}`;

                        // --- WARNING MESSAGES STYLES ---
                        if (currentWarns === 1) {
                            const warn1Text = 
`⚠️ *[ 1ST WARNING ]* ⚠️
━━━━━━━━━━━━━━━━━━━━
👤 *User:* ${username}
🚫 *Reason:* කුණුහරප / අසැබි වචන භාවිතය
📌 *Status:* Message Deleted!

💬 *සමූහය තුළ කුණුහරප භාවිතය තහනම්!*
⚠️ *තව වාර 2ක් වැරදි කළහොත් සමූහයෙන් ඉවත් කරනු ලැබේ!*
━━━━━━━━━━━━━━━━━━━━`;

                            await rememberBot.sendMessage(from, { text: warn1Text, mentions: [sender] });

                        } else if (currentWarns === 2) {
                            const warn2Text = 
`🚨 *[ 2ND WARNING - FINAL ALERT ]* 🚨
━━━━━━━━━━━━━━━━━━━━
👤 *User:* ${username}
🚫 *Reason:* කුණුහරප / අසැබි වචන භාවිතය
📌 *Status:* Message Deleted!

⚠️ *ඔබට හිමි අවසාන අවස්ථාව මෙයයි!*
❌ *තව එක් වරක් වැරදි කළහොත් කිසිදු දැනුම්දීමකින් තොරව Auto Kick කරනු ලැබේ!*
━━━━━━━━━━━━━━━━━━━━`;

                            await rememberBot.sendMessage(from, { text: warn2Text, mentions: [sender] });

                        } else if (currentWarns >= 3) {
                            const kickText = 
`🛑 *[ FINAL WARNING - KICKED ]* 🛑
━━━━━━━━━━━━━━━━━━━━
👤 *User:* ${username}
🚫 *Reason:* වාර 3ක්ම Group නීති පද්ධතිය උල්ලංඝනය කිරීම!

✈️ *සමූහයේ ආරක්ෂාව උදෙසා අදාළ සාමාජිකයාව Group එකෙන් ඉවත් කරන ලදී!*
━━━━━━━━━━━━━━━━━━━━`;

                            // Kick User
                            await rememberBot.groupParticipantsUpdate(from, [sender], "remove");
                            await rememberBot.sendMessage(from, { text: kickText, mentions: [sender] });

                            // Reset Warning Counter
                            userWarnings.delete(sender);
                        }

                        return; // Stop processing command
                    } catch (err) {
                        console.log("Anti-Bad Error:", err.message);
                    }
                }
            }
            // =======================================================

            // Command Processing
            if (body.startsWith('.')) {
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
