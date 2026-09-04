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

        // Logo Prompt එක Enhance කිරීම
        const enhancedPrompt = encodeURIComponent(`professional vector logo, ${q}, high quality, clean background, graphic design, 8k`);
        
        // Pollinations Free Image API URL
        const logoUrl = `https://pollinations.ai/p/${enhancedPrompt}?width=1024&height=1024&seed=${Math.floor(Math.random() * 1000000)}&model=flux`;

        // Image එක Send කිරීම
        await rememberBot.sendMessage(from, {
            image: { url: logoUrl },
            caption: `✨ *REMEMBER-MD AI LOGO GENERATOR* ✨\n\n📌 *Prompt:* ${q}\n👤 *Requested By:* ${pushname}\n\n> Powered by REMEMBER-MD`
        }, { quoted: mek });

    } catch (e) {
        console.log("Logo Command Error:", e);
        reply("❌ Logo එක සෑදීමේදී දෝෂයක් සිදු විය! නැවත උත්සාහ කරන්න.");
    }
});
