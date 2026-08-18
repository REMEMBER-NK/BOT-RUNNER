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
    if (!mongoUri) return console.log("❌ MONGODB Variable is missing in Railway!");

    try {
        await mongoose.connect(mongoUri);
        console.log("✅ Mongoose Connected Successfully!");
    } catch (err) {
        return console.log("❌ DB Connection Error:", err);
    }

    const sessionDir = path.join(__dirname, 'session');
    if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });

    // DB එකෙන් Session කියවන Clean Logic එක
    async function loadSessionFromDB() {
        try {
            const collections = await mongoose.connection.db.listCollections().toArray();
            for (let col of collections) {
                const docs = await mongoose.connection.db.collection(col.name).find({}).toArray();
                for (let doc of docs) {
                    if (doc.creds || doc.sessionData) {
                        const sessionData = doc.creds || doc.sessionData;
                        fs.writeFileSync(path.join(sessionDir, 'creds.json'), JSON.stringify(sessionData, null, 2));
                        console.log(`✅ Loaded Auto-Verified Session from Database!`);
                        return true;
                    }
                }
            }
        } catch (e) {
            console.log("⚠️ Error fetching session from DB:", e.message);
        }
        return false;
    }

    const isLoaded = await loadSessionFromDB();

    if (!isLoaded) {
        console.log("⚠️ Waiting for Auto-Verify Pairing from WEB-PAIR...");
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

    robin.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        
        if (connection === 'connecting') {
            console.log('🔄 Connecting to WhatsApp...');
        } else if (connection === 'close') {
            const statusCode = (lastDisconnect?.error)?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
            
            if (shouldReconnect) {
                await loadSessionFromDB();
                setTimeout(startBot, 3000);
            }
        } else if (connection === 'open') {
            console.log('✅ ROBIN-MD Auto-Verified & Connected Successfully!');
        }
    });

    // Commands Logic
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
