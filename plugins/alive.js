const { cmd } = require('../command');

cmd({
    pattern: "alive",
    desc: "Check bot status",
    category: "main",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        const aliveMsg = `*👋 Hey! ROBIN-MD is Alive & Active Now!*\n\n🤖 *Bot Name:* ROBIN-MD\n⚙️ *Status:* Online & Working\n\n_Type .menu to see all commands._`;
        
        return await conn.sendMessage(from, { text: aliveMsg }, { quoted: mek });

    } catch (e) {
        console.log("Alive Command Error:", e);
        reply(`❌ Error: ${e.message}`);
    }
});
