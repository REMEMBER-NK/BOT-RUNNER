const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const pino = require('pino');
const express = require('express');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 8080;

async function startBot() {
    const mongoUri = process.env.MONGODB; 
    if (!mongoUri) return console.log("❌ MONGODB Variable is missing!");

    try {
        await mongoose.connect(mongoUri);
        console.log("✅ Mongoose Connected Successfully!");
    } catch (err) {
        return console.log("❌ DB Error:", err);
    }

    // 1. Database එකෙන් Auto Session එක අල්ලන පාර
    const sessionDir = path.join(__dirname, 'session');
    if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });

    async function checkAndLoadSession() {
        try {
            const collections = await mongoose.connection.db.listCollections().toArray();
            for (let col of collections) {
                const docs = await mongoose.connection.db.collection(col.name).find({}).toArray();
                for (let doc of docs) {
                    // WEB-PAIR එකෙන් එන Session Objects අඳුනා ගැනීම
                    if (doc.creds || doc.data || doc.noiseKey || doc.me) {
                        const sessionData = doc.creds || (typeof doc.data === 'string' ? JSON.parse(doc.data) : doc.data) || doc;
                        delete sessionData._id;
                        fs.writeFileSync(path.join(sessionDir, 'creds.json'), JSON.stringify(sessionData, null, 2));
                        console.log(`✅ Loaded Auto-Verified Session from: [${col.name}]`);
                        return true;
                    }
                }
            }
        } catch (e) {
            console.log("⚠️ Session Check Error:", e.message);
        }
        return false;
    }

    const isLoaded = await checkAndLoadSession();
    if (!isLoaded) {
        console.log("⚠️ Waiting for Auto-Verify Session from WEB-PAIR...");
    }

    // Load Plugins
    const pluginsDir = path.join(__dirname, 'plugins');
    if (fs.existsSync(pluginsDir)) {
        fs.readdirSync(pluginsDir).forEach((plugin) => {
            if (path.extname(plugin).toLowerCase() === '.js') {
                require(path.join(pluginsDir, plugin));
            }
        });
    }

    // 2. Auth & WhatsApp Socket Setup
    const { state, saveCreds } = await useMultiFileAuthState('./session');
    const { version } = await fetchLatestBaileysVersion();

    const robin = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        browser: ['ROBIN-MD', 'Safari', '1.0.0'],
        auth: state,
        version
    });

    robin.ev.on('creds.update', saveCreds);

    // 3. Auto Reconnect & Verify Status Listener
    robin.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        
        if (connection === 'connecting') {
            console.log('🔄 Connecting / Auto-Verifying with WhatsApp...');
        } else if (connection === 'close') {
            const statusCode = (lastDisconnect?.error)?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
            
            // Session එකක් DB එකේ නැතිව Fail වුණානම් ආයෙ DB එක Check කරලා Reconnect වීම
            if (shouldReconnect) {
                await checkAndLoadSession();
                setTimeout(startBot, 3000);
            }
        } else if (connection === 'open') {
            console.log('✅ ROBIN-MD Auto-Verified & Connected Successfully!');
        }
    });

    // Message Command Logic
    const events = require('./command');
    robin.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const mek = chatUpdate.messages[0];
            if (!mek || !mek.message) return;

            const from = mek.key.remoteJid;
            const body = mek.message.conversation || mek.message.extendedTextMessage?.text || "";

            if (body.startsWith('.')) {
                const commandName = body.slice(1).split(" ")[0].toLowerCase();
                const cmd = events.commands.find((c) => c.pattern === commandName);
                if (cmd) {
                    const reply = (text) => robin.sendMessage(from, { text }, { quoted: mek });
                    cmd.function(robin, mek, mek, { from, reply, body });
                }
            }
        } catch (e) {
            console.log("Message Handler Error:", e);
        }
    });
}

app.get('/', (req, res) => res.send('ROBIN-MD Bot Running!'));
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

startBot();
