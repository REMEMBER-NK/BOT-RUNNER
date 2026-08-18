const { default: makeWASocket, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const pino = require('pino');
const express = require('express');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 8080;

// MongoDB Session Schema & Model Define කිරීම
const AuthSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    data: { type: String, required: true }
});
const AuthModel = mongoose.models.Auth || mongoose.model('Auth', AuthSchema);

// MongoDB Auth State Handler
async function useMongoDBAuthState() {
    const readData = async (id) => {
        try {
            const result = await AuthModel.findOne({ id });
            return result ? JSON.parse(result.data) : null;
        } catch (e) {
            return null;
        }
    };

    const writeData = async (id, data) => {
        try {
            const value = JSON.stringify(data);
            await AuthModel.findOneAndUpdate({ id }, { data: value }, { upsert: true });
        } catch (e) {}
    };

    const removeData = async (id) => {
        try {
            await AuthModel.deleteOne({ id });
        } catch (e) {}
    };

    const creds = (await readData('creds')) || require('@whiskeysockets/baileys').initAuthCreds();

    return {
        state: {
            creds,
            keys: {
                get: async (type, ids) => {
                    const data = {};
                    await Promise.all(
                        ids.map(async (id) => {
                            let value = await readData(`${type}-${id}`);
                            if (type === 'app-state-sync-key' && value) {
                                value = require('@whiskeysockets/baileys').proto.Message.AppStateSyncKeyData.fromObject(value);
                            }
                            data[id] = value;
                        })
                    );
                    return data;
                },
                set: async (data) => {
                    const tasks = [];
                    for (const category in data) {
                        for (const id in data[category]) {
                            const value = data[category][id];
                            const key = `${category}-${id}`;
                            tasks.push(value ? writeData(key, value) : removeData(key));
                        }
                    }
                    await Promise.all(tasks);
                }
            }
        },
        saveCreds: () => writeData('creds', creds)
    };
}

async function startBot() {
    const mongoUri = process.env.MONGODB; 
    if (!mongoUri) {
        console.log("❌ MONGODB Variable is missing!");
        return;
    }

    try {
        await mongoose.connect(mongoUri);
        console.log("✅ Mongoose Connected Successfully!");
    } catch (err) {
        console.log("❌ DB Error:", err);
        return;
    }

    // Plugins load කිරීම
    const pluginsDir = path.join(__dirname, 'plugins');
    if (fs.existsSync(pluginsDir)) {
        fs.readdirSync(pluginsDir).forEach((plugin) => {
            if (path.extname(plugin).toLowerCase() === '.js') {
                require(path.join(pluginsDir, plugin));
            }
        });
    }

    // Auth State from MongoDB
    const { state, saveCreds } = await useMongoDBAuthState();
    const { version } = await fetchLatestBaileysVersion();

    const robin = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        browser: ['ROBIN-MD', 'Safari', '1.0.0'],
        auth: state,
        version
    });

    robin.ev.on('creds.update', saveCreds);

    // Connection Status
    robin.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'connecting') {
            console.log('🔄 Connecting to WhatsApp via MongoDB Session...');
        } else if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log('✅ ROBIN-MD Connected Successfully!');
        }
    });

    // Message Logic
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
