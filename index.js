const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const pino = require('pino');
const express = require('express');
const mongoose = require('mongoose'); // මේක අනිවාර්යයි
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

async function startBot() {
    // 1. Mongoose Connection එක
    const mongoUri = process.env.MONGODB; 
    if (!mongoUri) {
        console.log("❌ MONGODB variable not found in Railway!");
        return;
    }
    await mongoose.connect(mongoUri);
    console.log("✅ Mongoose Connected Successfully!");

    console.log("Connecting ROBIN-MD Bot...");
    
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
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log('✅ ROBIN-MD Connected Successfully!');
        }
    });

    // Message Handler
    const events = require('./command');
    robin.ev.on('messages.upsert', async (chatUpdate) => {
        const mek = chatUpdate.messages[0];
        if (!mek.message) return;
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
    });
}

app.get('/', (req, res) => res.send('ROBIN-MD Bot is Running!'));
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

startBot();
