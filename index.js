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

// TAHANAM WACHANA & MEDIA KEYWORDS (NSFW / BAD WORDS)
const BAD_WORDS = [
    "puka", "paka", "htt", "hukana", "huththa", "kari", "ponnaya", "hukapan", "hukano", "pakaya", "ponna", "hutho", "huththo",
    "sex", "xnxx", "porn", "nude", "naked", "boobs", "bitch", "adult", "xxx", "fuck", "pussy", "dick"
];

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

    // Message Handler Engine
    rememberBot.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const mek = chatUpdate.messages[0];
            if (!mek || !mek.message) return;

            const msgId = mek.key.id;
            if (processedMessages.has(msgId)) return;
            processedMessages.add(msgId);
            setTimeout(() => processedMessages.delete(msgId), 60000);

            const from = mek.key.remoteJid;
            const isGroup = from.endsWith('@g.us');
            const sender = isGroup ? (mek.key.participant || mek.key.remoteJid) : mek.key.remoteJid;
            
            const type = Object.keys(mek.message)[0];
            const msg = type === 'viewOnceMessage' ? mek.message.viewOnceMessage.message : mek.message;
            
            // Text, Captions, and File Name Fetching
            const body = msg.conversation || 
                         msg.extendedTextMessage?.text || 
                         msg.imageMessage?.caption || 
                         msg.videoMessage?.caption || 
                         msg.documentMessage?.caption || 
                         msg.documentMessage?.fileName || '';

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
            // 🚨 ADVANCED NSFW & BAD-WORD CONTENT FILTER (Text + Media)
            // =======================================================
            if (isGroup) {
                let isNsfwDetected = false;

                // 1. Text හෝ Caption එකේ තහනම් වචන ඇත්දැයි බැලීම
                if (body) {
                    isNsfwDetected = BAD_WORDS.some(word => body.toLowerCase().includes(word));
                }

                // 2. View Once, Image, Video හෝ Sticker එකක් නම් ඒවාද Auto Check කිරීම
                // (සමහර නරක පින්තූර/ස්ටිකර් වල Meta වල පවා NSFW නම වැටී තිබිය හැක)
                if (type === 'imageMessage' || type === 'videoMessage' || type === 'stickerMessage' || type === 'viewOnceMessage') {
                    // Botට Admin බලතල නැත්නම් Delete කිරීමට නොහැකි නිසා Admin චෙක් කරයි
                    // මෙහිදී ඕනෑම Media එකක නමක් හෝ file details වල නරක වචනයක් ඇත්නම් අල්ලයි
                    if (body && BAD_WORDS.some(word => body.toLowerCase().includes(word))) {
                        isNsfwDetected = true;
                    }
                }

                if (isNsfwDetected) {
                    try {
                        // Bot Admin කෙනෙක් නම් පමණක් Message එක Delete කළ හැක
                        if (isBotAdmin) {
                            await rememberBot.sendMessage(from, { delete: mek.key });
                        } else {
                            await reply("⚠️ *NSFW පින්තූරයක්/පණිවිඩයක් හමු විය! මාව Group Admin කෙනෙක් ලෙස පත් කරන්න එවිට මට එය මැකිය හැක.*");
                            return;
                        }

                        let currentWarns = (userWarnings.get(sender) || 0) + 1;
                        userWarnings.set(sender, currentWarns);

                        const username = `@${sender.split('@')[0]}`;

                        if (currentWarns === 1) {
                            await rememberBot.sendMessage(from, { 
                                text: `⚠️ *[ 1ST WARNING ]*\n━━━━━━━━━━━━━━━━━━━━\n👤 *User:* ${username}\n🚫 *Reason:* අසැබි (NSFW) පින්තූර හෝ වචන යැවීම තහනම්!\n📌 *Status:* Content Deleted!`, 
                                mentions: [sender] 
                            });
                        } else if (currentWarns === 2) {
                            await rememberBot.sendMessage(from, { 
                                text: `🚨 *[ 2ND WARNING - FINAL ALERT ]*\n━━━━━━━━━━━━━━━━━━━━\n👤 *User:* ${username}\n⚠️ *තව එක් වරක් නීති කඩ කළහොත් Group එකෙන් ඉවත් කරනු ලැබේ!*`, 
                                mentions: [sender] 
                            });
                        } else if (currentWarns >= 3) {
                            await rememberBot.sendMessage(from, { 
                                text: `🛑 *[ KICKED FROM GROUP ]*\n━━━━━━━━━━━━━━━━━━━━\n👤 *User:* ${username}\n✈️ *වවාර් 3ක් නීති කැඩූ බැවින් ඉවත් කරන ලදී!*`, 
                                mentions: [sender] 
                            });
                            if (isBotAdmin) {
                                await rememberBot.groupParticipantsUpdate(from, [sender], "remove");
                            }
                            userWarnings.delete(sender);
                        }

                        return;
                    } catch (err) {
                        console.log("Anti-NSFW Error:", err.message);
                    }
                }
            }
            // =======================================================

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
        
        await groupMetadata = await checkForNewSessions(); // Safe Init
        
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
