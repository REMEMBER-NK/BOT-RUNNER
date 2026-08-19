const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const pino = require('pino');
const express = require('express');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 8080;

// 1. Plugins ටික එකපාර මුලින්ම Load කිරීම
const events = require('./command');
const pluginsDir = path.join(__dirname, 'plugins');
if (fs.existsSync(pluginsDir)) {
    fs.readdirSync(pluginsDir).forEach((plugin) => {
        if (path.extname(plugin).toLowerCase() === '.js') {
            require(path.join(pluginsDir, plugin));
        }
    });
}

// 2. එක එක Session එකට වෙන වෙනම Bot Instance එකක් Start කරන Function එක
async function startSingleBotInstance(sessionId, sessionData, version) {
    const sessionDir = path.join(__dirname, 'sessions', sessionId);
    if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });

    // Session Data එක adාල Folder එක ඇතුළේ creds.json එකට ලියයි
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
                if (fs.existsSync(sessionDir)) fs.rmSync(sessionDir, { recursive: true, force: true });
                await mongoose.connection.db.collection('sessions').deleteOne({ id: sessionId });
            } else if (shouldReconnect) {
                setTimeout(() => startSingleBotInstance(sessionId, sessionData, version), 3000);
            }
        } else if (connection === 'open') {
            console.log(`✅ REMEMBER-MD Connected Successfully for [${sessionId}]!`);
        }
    });

    // Message / Command Handler එක dynamic ව ප්‍රත්‍යක්ෂ වේ
    rememberBot.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const mek = chatUpdate.messages[0];
            if (!mek || !mek.message) return;

            const from = mek.key.remoteJid;
            const body = mek.message.conversation || mek.message.extendedTextMessage?.text || "";

            if (body.startsWith('.')) {
                const commandName = body.slice(1).split(" ")[0].toLowerCase();
                const cmd = events.commands.find((c) => c.pattern === commandName);
                if (cmd) {
                    const reply = (text) => rememberBot.sendMessage(from, { text }, { quoted: mek });
                    cmd.function(rememberBot, mek, mek, { from, reply, body });
                }
            }
        } catch (e) {
            console.log(`Message Handler Error [${sessionId}]:`, e);
        }
    });
}

// 3. Main Master Launcher (Database එකේ තියෙන සියලුම Sessions Load කරයි)
async function startAllBots() {
    const mongoUri = process.env.MONGODB; 
    if (!mongoUri) return console.log("❌ MONGODB Variable is missing in Railway!");

    try {
        await mongoose.connect(mongoUri);
        console.log("✅ Mongoose Connected Successfully!");
    } catch (err) {
        return console.log("❌ DB Connection Error:", err);
    }

    try {
        const { version } = await fetchLatestBaileysVersion();
        
        // sessions collection එකේ තියෙන සියලුම active documents ලබා ගැනීම
        const docs = await mongoose.connection.db.collection('sessions').find({}).toArray();

        if (!docs || docs.length === 0) {
            console.log("⚠️ Database එකේ සක්‍රීය Sessions කිසිවක් හමු නොවීය!");
            return;
        }

        console.log(`🚀 Found ${docs.length} active session(s). Starting Bots...`);

        // Loop එකක් මගින් එක එක session එකට වෙන වෙනම bot run කිරීම
        for (let doc of docs) {
            const sessionId = doc.id || `session_${doc._id}`;
            const sessionData = doc.creds || doc.sessionData;
            if (sessionData) {
                await startSingleBotInstance(sessionId, sessionData, version);
            }
        }
    } catch (e) {
        console.log("⚠️ Error loading sessions from DB:", e.message);
    }
}

app.get('/', (req, res) => res.send('REMEMBER-MD Multi-Bot Runner Active!'));
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

startAllBots();
