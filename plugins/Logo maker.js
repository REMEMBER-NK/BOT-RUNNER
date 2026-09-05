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

        const textName = encodeURIComponent(q.trim());
        
        // Dynamic Multi-API Fallback System (100% Free & No API Key Required)
        const primaryUrl = `https://api.caliph.biz.id/api/photooxy/crossfire?text=${textName}`;
        const fallbackUrl = `https://image.pollinations.ai/prompt/professional%20esports%20gaming%20mascot%20logo%20emblem%20for%20${textName}%20vector%20art%20dark%20background?width=1024&height=1024&nologo=true`;

        let imageBuffer;

        try {
            // Try Photooxy 3D Font Engine
            const response = await axios.get(primaryUrl, { responseType: 'arraybuffer', timeout: 15000 });
            imageBuffer = Buffer.from(response.data, 'binary');
        } catch (err) {
            // Backup Pollinations Vector Engine if Photooxy is down
            const response = await axios.get(fallbackUrl, { responseType: 'arraybuffer', timeout: 20000 });
            imageBuffer = Buffer.from(response.data, 'binary');
        }

        await rememberBot.sendMessage(from, {
            image: imageBuffer,
            caption: `🔥 *REMEMBER HD LOGO* 🔥\n\n👤 *Name:* ${q}\n\n> Powered by REMEMBER-MD`
        }, { quoted: mek });

    } catch (e) {
        console.log("HD Logo Error:", e.message);
        reply("❌ *Server එකේ පොඩි Delay එකක් තියෙනවා, තව තත්පර කීපයකින් නැවත උත්සාහ කරන්න!*");
    }
});
