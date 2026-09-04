const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "logo",
    alias: ["genlogo", "logomaker"],
    desc: "Generate custom logo using AI",
    category: "tools",
    use: '.logo <ඔයාට ඕන විස්තරය>',
    filename: __filename
},
async (rememberBot, mek, m, { from, reply, args, q, pushname }) => {
    try {
        if (!q) return reply("⚠️ *කරුණාකර Logo එකට ඕන විස්තරය ලබාදෙන්න!*\n\n*උදාහරණ:* `.logo Red Lion Esports Gaming Logo, vector style, dark background`");

        await reply("🎨 *ඔයාගේ Logo එක නිර්මාණය වෙමින් පවතී... සුළු මොහොතක් රැඳී සිටින්න!*");

        // Enhanced Prompt
        const promptText = `professional vector gaming logo, ${q}, high resolution, sharp details, centered, vector art, vibrant colors, clean background`;
        const logoUrl = `https://pollinations.ai/p/${encodeURIComponent(promptText)}?width=1024&height=1024&seed=${Math.floor(Math.random() * 1000000)}&model=flux`;

        // Image එක Buffer එකක් ලෙස Fetch කරගැනීම (WhatsApp Media Loading Fix)
        const response = await axios.get(logoUrl, { responseType: 'arraybuffer', timeout: 30000 });
        const imageBuffer = Buffer.from(response.data, 'binary');

        // Send Image Buffer directly
        await rememberBot.sendMessage(from, {
            image: imageBuffer,
            caption: `✨ *REMEMBER-MD AI LOGO GENERATOR* ✨\n\n📌 *Prompt:* ${q}\n👤 *Requested By:* ${pushname}\n\n> Powered by REMEMBER-MD`
        }, { quoted: mek });

    } catch (e) {
        console.log("Logo Command Error:", e.message);
        reply("❌ *Logo එක Generate කිරීමේදී දෝෂයක් සිදු විය! මොහොතකින් නැවත උත්සාහ කරන්න.*");
    }
});
