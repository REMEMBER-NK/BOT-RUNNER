const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const pino = require('pino');
const express = require('express');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 8080;

// Dynamic Session Schema for MongoDB
const SessionSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    data: { type: Object, required: true }
});
const Session = mongoose.models.Session || mongoose.model('Session', SessionSchema);

async function startBot() {
    const mongoUri = process.env.MONGODB; 
    if (!mongoUri) return console.log("❌ MONGODB Variable is missing!");

    try {
        await mongoose.connect(mongoUri);
        console.log("✅ Mongoose Connected Successfully!");
    } catch (err) {
        return console.log("❌ DB Error:", err);
    }

    // 1. Database එකේ තිබෙන ඕනෑම Session Data එකක් Fetch කිරීම
    try {
        const sessionDir = path.join(__dirname, 'session');
        if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir);

        const dbSession = await Session.findOne({ $or: [{ id: 'creds' }, { id: 'session' }] });
        
        if (dbSession && dbSession.data) {
            fs.writeFileSync(path.join(sessionDir, 'creds.json'), JSON.stringify(dbSession.data));
            console.log("✅ Loaded Session Credentials from MongoDB!");
        } else {
            console.log("⚠️ No Session Data Found in Database!");
        }
    } catch (e) {
        console.log("⚠️ Session Fetch Error:", e.message);
    }

    // 2. Load Plugins/Commands
    const pluginsDir = path.join(__dirname, 'plugins');
    if (fs.existsSync(pluginsDir)) {
        fs.readdirSync(pluginsDir).forEach((plugin) => {
            if (path.extname(plugin).toLowerCase() === '.js') {
                require(path.join(pluginsDir, plugin));
            }
        });
    }

    // 3. Auth State Init
    const { state, saveCreds } = await useMultiFileAuthState('./session');
    const { version } = await fetchLatestBaileysVersion();

    const robin = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        browser: ['ROBIN-MD', 'Safari', '1.0.0'],
        auth: state,
        version
    });

    // Creds Update වෙද්දී DB එකටත් Sync කිරීම
    robin.ev.on('creds.update', async () => {
        await saveCreds();
        try {
            const credsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'session', 'creds.json')));
            await Session.findOneAndUpdate({ id: 'creds' }, { data: credsData }, { upsert: true });
        } catch (e) {}
    });

    // 4. Connection Status Listener
    robin.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'connecting') {
            console.log('🔄 Connecting to WhatsApp...');
        } else if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log('✅ ROBIN-MD Connected Successfully!');
        }
    });

    // 5. Message Command Execution
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
