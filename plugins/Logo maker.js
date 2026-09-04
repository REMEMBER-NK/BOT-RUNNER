const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "logo",
    alias: ["genlogo", "logomaker", "ailogo"],
    desc: "Generate Any Custom AI Logo with Name and Idea",
    category: "tools",
    use: '.logo <නම> | <ඕනෑම විස්තරයක්/Idea එකක්>',
    filename: __filename
},
async (rememberBot, mek, m, { from, reply, args, q, pushname }) => {
    try {
        if (!q) return reply("⚠️ *කරුණාකර Logo එකට ඕන විස්තරය ලබාදෙන්න!*\n\n*උදාහරණ:* \n1. `.logo Cyberpunk Neon Wolf logo` \n2. `.logo REMEMBER EDITZ | Red Lion Mascot Logo`");

        await reply("🎨 *ඔයාගේ Custom AI Logo එක නිර්මාණය වෙමින් පවතී... සුළු මොහොතක් රැඳී සිටින්න!*");

        let name = pushname;
        let idea = q;

        // "|" ලකුණෙන් නම සහ Idea එක වෙන් කර ඇත්නම්
        if (q.includes("|")) {
            const parts = q.split("|");
            name = parts[0].trim();
            idea = parts[1].trim();
        }

        // Universal HD AI Prompt Engine
        const enhancedPrompt = encodeURIComponent(`professional vector logo of ${idea}, centered avatar, graphic design style, sharp details, dark background, 8k resolution`);
        const randomSeed = Math.floor(Math.random() * 999999);
        
        // Fast Flux Engine
        const logoUrl = `https://image.pollinations.ai/prompt/${enhancedPrompt}?width=1024&height=1024&seed=${randomSeed}&model=flux&nologo=true`;

        // Fetch Image Buffer
        const response = await axios.get(logoUrl, { responseType: 'arraybuffer', timeout: 35000 });
        const imageBuffer = Buffer.from(response.data, 'binary');

        await rememberBot.sendMessage(from, {
            image: imageBuffer,
            caption: `✨ *REMEMBER-MD AI LOGO GENERATOR* ✨\n\n📌 *Concept:* ${idea}\n👤 *Requested By:* ${name}\n\n> Powered by REMEMBER-MD`
        }, { quoted: mek });

    } catch (e) {
        console.log("Logo Command Error:", e.message);
        reply("❌ *Logo එක Generate කිරීමේදී දෝෂයක් සිදු විය! මොහොතකින් නැවත උත්සාහ කරන්න.*");
    }
});
