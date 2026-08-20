const { cmd } = require('../command');

cmd({
    pattern: "alive",
    desc: "Check bot status",
    category: "main",
    filename: __filename
},
async (conn, mek, m, { from }) => {
    try {
        const aliveMsg = `*Hey! I'm ᏒᏋᎷᏋᎷᏰᏋᏒ ᎷᎴ*\n\n*💖 Here For You!*\n\n*version:* 1.0.0 Online*\n\n*contact owner*\n\n+94761576618 \n\n THANK YOU 🙉`;
        
        return await conn.sendMessage(from, {
            image: { url: "https://raw.githubusercontent.com/REMEMBER-NK/Bot-helpur/refs/heads/main/31322071b2dd4757a80b264729c42ee7.png" },
            caption: aliveMsg
        }, { quoted: mek });

    } catch (e) {
        console.log("Alive Command Error:", e);
        await conn.sendMessage(from, { text: `❌ Error: ${e.message}` }, { quoted: mek });
    }
});
