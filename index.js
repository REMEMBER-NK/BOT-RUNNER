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

// 🧠 Message Memory Store (Anti-Delete සඳහා)
const msgStore = new Map();

// Global Anti-Delete State
if (typeof global.antiDeleteEnabled === 'undefined') {
    global.antiDeleteEnabled = true;
}

// 1. Plugins Auto Load
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

// Helper: Profile Picture URL Grabber
async function getProfilePicUrl(bot, jid) {
    try {
        const ppUrl = await bot.profilePictureUrl(jid, 'image');
        return ppUrl || 'https://i.ibb.co/6BRM12f/avatar-contact.png';
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

    // -------------------------------------------------------------
    // 👋 1. GROUP WELCOME ENGINE (WITH PHOTO CARD)
    // -------------------------------------------------------------
    rememberBot.ev.on('group-participants.update', async (update) => {
        try {
            const { id, participants, action } = update;
            if (!id || !id.endsWith('@g.us')) return;

            const botJid = rememberBot.user?.id ? rememberBot.user.id.split(':')[0] + '@s.whatsapp.net' : '';

            if (action === 'add') {
                for (let num of participants) {
                    if (num === botJid) continue; // Bot එක තමන්වම Welcome කරගැනීම වැළැක්වීම

                    const userJid = num;
                    const userName = `@${userJid.split('@')[0]}`;

                    let groupName = "Group";
                    let memberCount = "1+";
                    try {
                        const groupMetadata = await rememberBot.groupMetadata(id);
                        groupName = groupMetadata.subject || "Group";
                        memberCount = groupMetadata.participants ? groupMetadata.participants.length : "1+";
                    } catch (e) {}

                    const ppUrl = await getProfilePicUrl(rememberBot, userJid);

                    // Image Link Generator (Popcat Welcome Card)
                    const welcomeImgUrl = `https://raw.githubusercontent.com/REMEMBER-NK/Bot-helpur/refs/heads/main/31322071b2dd4757a80b264729c42ee7.png(userJid.split('@')[0])}&text2=Welcome+To+${encodeURIComponent(groupName.replace(/[^a-zA-Z0-9 ]/g, ""))}&text3=Member+${memberCount}&avatar=${encodeURIComponent(ppUrl)}`;

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
    // 🗑️ 2. CUSTOM FORMATTED ANTI-DELETE ENGINE
    // -------------------------------------------------------------
    rememberBot.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const mek = chatUpdate.messages[0];
            if (!mek || !mek.message) return;

            const msgId = mek.key.id;
            const from = mek.key.remoteJid;
            const type = Object.keys(mek.message)[0];

            // 🛑 Protocol Message Detection (Delete for Everyone)
            if (type === 'protocolMessage' && mek.message.protocolMessage.type === 0) {
                if (global.antiDeleteEnabled === false) return;

                const deletedKey = mek.message.protocolMessage.key;
                const storedMsg = msgStore.get(deletedKey.id);

                if (storedMsg) {
                    const deleter = mek.key.participant || mek.key.remoteJid || from;
                    const originalSender = storedMsg.key.participant || storedMsg.key.remoteJid || from;

                    const timeString = new Date().toLocaleString('en-US', { timeZone: 'Asia/Colombo' });

                    const innerMsg = Object.keys(storedMsg.message)[0] === 'viewOnceMessage' ? storedMsg.message.viewOnceMessage.message : storedMsg.message;
                    const originalText = innerMsg.conversation || 
                                         innerMsg.extendedTextMessage?.text || 
                                         innerMsg.imageMessage?.caption || 
                                         innerMsg.videoMessage?.caption || 
                                         innerMsg.documentMessage?.caption || 
                                         (innerMsg.imageMessage ? '📷 Image' : innerMsg.videoMessage ? '🎥 Video' : innerMsg.audioMessage ? '🎵 Voice/Audio' : '📁 Document');

                    // ඔයා ඉල්ලපු Format එකටම සකස් කළ Caption එක:
                    const deletedCaption = `🗑️ *Deleted Message Recovered*\n\n` +
                                           `👤 *Deleted By:* @${deleter.split('@')[0]}\n` +
                                           `👤 *Original Sender:* @${originalSender.split('@')[0]}\n` +
                                           `🕒 *Time:* ${timeString}\n\n` +
                                           `📝 *Message:* ${originalText}`;

                    // Message & Caption එක Yැවීම
                    await rememberBot.sendMessage(from, { 
                        text: deletedCaption, 
                        mentions: [deleter, originalSender] 
                    });

                    // Media Message එකක් නම් ඒ Media එකත් Forward කිරීම
                    if (innerMsg.imageMessage || innerMsg.videoMessage || innerMsg.audioMessage || innerMsg.documentMessage || innerMsg.stickerMessage) {
                        await rememberBot.sendMessage(from, { forward: storedMsg }, { quoted: storedMsg });
                    }

                    msgStore.delete(deletedKey.id);
                }
                return;
            }

            // 💾 Normal Message Store (Memory)
            if (!mek.key.fromMe) {
                msgStore.set(msgId, mek);
                if (msgStore.size > 1000) {
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

            // Group Admin Checks
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
                } catch (e) {}
            }

            // Command Engine
            if (body && body.startsWith('.')) {
                const args = body.trim().split(/ +/).slice(1);
                const commandName = body.slice(1).split(" ")[0].toLowerCase();
                const q = args.join(" ");

                const cmd = events.commands.find((c) => 
                    c.pattern === commandName || (c.alias && c.alias.includes(commandName))
                );

                if (cmd) {
                    cmd.function(rememberBot, mek, mek, { 
                        from, reply, body, args, q, pushname, quoted: mek, isCmd: true, command: commandName, isGroup, sender, isBotAdmin, isGroupAdmin 
                    });
                }
            }

        } catch (e) {
            console.log(`Message Error [${sessionId}]:`, e);
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

// 4. Main Launcher
async function startAllBots() {
    const mongoUri = process.env.MONGODB; 
    if (!mongoUri) return console.log("❌ MONGODB Variable missing!");

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
