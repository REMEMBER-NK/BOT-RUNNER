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
        
        return await conn.sendMessage(from, {
            image: { url: "https://raw.githubusercontent.com/REMEMBER-NK/Bot-helpur/refs/heads/main/31322071b2dd4757a80b264729c42ee7.png" },
            caption: aliveMsg
        }, { quoted: mek });

    } catch (e) {
        console.log(e);
        reply(`❌ Error: ${e.message}`);
    }
});
