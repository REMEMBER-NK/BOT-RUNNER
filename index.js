const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, delay } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const pino = require('pino');
const express = require('express');
const { readEnv } = require('./lib/mongodb');
const { commands } = require('./command');

const app = express();
const PORT = process.env.PORT || 8000;

async function startBot() {
    console.log("Connecting ROBIN-MD Bot...");
    
    // Load Plugins / Commands
    const events = require('./command');
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
            console.log('Connection closed. Reconnecting:', shouldReconnect);
            if (shouldReconnect) {
                startBot();
            }
        } else if (connection === 'open') {
            console.log('✅ ROBIN-MD Connected Successfully!');
        }
    });

    // Listen to Messages & Commands
    robin.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const mek = chatUpdate.messages[0];
            if (!mek.message) return;
            mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message;
            
            const from = mek.key.remoteJid;
            const type = Object.keys(mek.message)[0];
            const body = (type === 'conversation') ? mek.message.conversation : (type === 'extendedTextMessage') ? mek.message.extendedTextMessage.text : '';
            
            if (!body.startsWith('.')) return; // Prefix = '.'
            
            const commandName = body.slice(1).trim().split(/ +/).shift().toLowerCase();
            const cmd = events.commands.find((c) => c.pattern === commandName);

            if (cmd) {
                const reply = (text) => robin.sendMessage(from, { text: text }, { quoted: mek });
                cmd.function(robin, mek, mek, { from, reply, body });
            }
        } catch (err) {
            console.log('Message Error:', err);
        }
    });
}

app.get('/', (req, res) => res.send('ROBIN-MD Bot is Running!'));
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

startBot();
