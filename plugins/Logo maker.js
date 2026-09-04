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
        const promptText = `professional vector gaming logo, ${q}, clean vector art, vibrant colors, centered, high quality`;
        const encodedPrompt = encodeURIComponent(promptText);
        const randomSeed = Math.floor(Math.random() * 1000000);
        
        // Updated Correct Pollinations API URL Structure
        const logoUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&seed=${randomSeed}&model=flux&nologo=true`;

        try {
            // Option 1: Try fetching as Buffer (Fastest & Safest)
            const response = await axios.get(logoUrl, { responseType: 'arraybuffer', timeout: 25000 });
            const imageBuffer = Buffer.from(response.data, 'binary');

            await rememberBot.sendMessage(from, {
                image: imageBuffer,
                caption: `✨ *REMEMBER-MD AI LOGO GENERATOR* ✨\n\n📌 *Prompt:* ${q}\n👤 *Requested By:* ${pushname}\n\n> Powered by REMEMBER-MD`
            }, { quoted: mek });

        } catch (bufferErr) {
            // Option 2: Fallback to Direct URL if Buffer Fetch Times out
            await rememberBot.sendMessage(from, {
                image: { url: logoUrl },
                caption: `✨ *REMEMBER-MD AI LOGO GENERATOR* ✨\n\n📌 *Prompt:* ${q}\n👤 *Requested By:* ${pushname}\n\n> Powered by REMEMBER-MD`
            }, { quoted: mek });
        }

    } catch (e) {
        console.log("Logo Command Error:", e.message);
        reply("❌ *Logo එක Generate කිරීමේදී දෝෂයක් සිදු විය! මොහොතකින් නැවත උත්සාහ කරන්න.*");
    }
});
