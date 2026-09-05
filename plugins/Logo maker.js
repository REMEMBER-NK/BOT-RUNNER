const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "logo",
    alias: ["hdlogo", "prologo"],
    desc: "Generate HD Mascot Logo with Perfect Name",
    category: "tools",
    use: '.logo <ඔයාගේ නම>',
    filename: __filename
},
async (rememberBot, mek, m, { from, reply, args, q, pushname }) => {
    try {
        if (!q) return reply("⚠️ *කරුණාකර Logo එකට වැටෙන්න ඕන Name එක ලබාදෙන්න!*\n\n*උදාහරණ:* `.logo CRIMINAL GAMER`");

        await reply("🎨 *Professional HD Gaming Logo එක සකස් වෙමින් පවතී... සුළු මොහොතක් රැඳී සිටින්න!*");

        const text = encodeURIComponent(q.trim());
        
        // High Quality Esports Templates with Perfect 3D Typography
        const logoStyleUrl = `https://api.lolhuman.xyz/api/ephoto1/fpslogo?apikey=gatito&text=${text}`;

        const response = await axios.get(logoStyleUrl, { responseType: 'arraybuffer', timeout: 30000 });
        const imageBuffer = Buffer.from(response.data, 'binary');

        await rememberBot.sendMessage(from, {
            image: imageBuffer,
            caption: `🔥 *REMEMBER HD LOGO* 🔥\n\n👤 *Name:* ${q}\n\n> Powered by REMEMBER-MD`
        }, { quoted: mek });

    } catch (e) {
        console.log("HD Logo Error:", e.message);
        reply("❌ *Logo එක සෑදීමේදී දෝෂයක් සිදු විය! මොහොතකින් නැවත උත්සාහ කරන්න.*");
    }
});
