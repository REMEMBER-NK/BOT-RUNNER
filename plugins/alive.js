const { readEnv } = require('../lib/mongodb'); // Fix: DB එක වෙනුවට mongodb.js එකෙන් ගත්තේ
const { cmd, commands } = require('../command');

cmd({
    pattern: "alive",
    desc: "Check bot online or no.",
    category: "main",
    filename: __filename
},
async(robin, mek, m, { from, reply }) => {
    try {
        let config = {};
        try {
            config = await readEnv();
        } catch (dbErr) {
            console.log("DB Read Error, using fallback options");
        }

        // Fallback options (DB එකේ values නැත්නම් වැඩ කරන්න)
        const aliveImg = config.ALIVE_IMG || "https://i.ibb.co/689N3M9/thumb.jpg"; // Default Image Link එකක්
        const aliveMsg = config.ALIVE_MSG || "*ROBIN-MD is Active & Online!* 🚀";

        return await robin.sendMessage(from, {
            image: { url: aliveImg },
            caption: aliveMsg
        }, { quoted: mek });

    } catch (e) {
        console.log("Alive Command Error:", e);
        reply(`❌ Error: ${e.message || e}`);
    }
});
