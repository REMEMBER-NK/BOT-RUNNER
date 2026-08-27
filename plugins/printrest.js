const { cmd } = require("../command");
const axios = require("axios");

// NO-NPM EXTRA PACKAGES IMAGE SEARCH (.pin / .img)
cmd(
  {
    pattern: "pinterest",
    alias: ["pin", "pins", "img", "image"],
    react: "📌",
    desc: "Search and download HD images without extra npm packages",
    category: "download",
    filename: __filename
  },
  async (remember, mek, m, { from, reply, args }) => {
    try {
      const query = args.join(" ");
      if (!query) return reply("❌ කරුණාකර සෙවිය යුතු නම ලබාදෙන්න!\n\nEx: `.pin naruto wallpaper`");

      reply(`⏳ *"${query}" සඳහා Image එකක් සොයමින් පවතී...*`);

      // 1. Get Token from DuckDuckGo
      const tokenRes = await axios.get(`https://duckduckgo.com/?q=${encodeURIComponent(query)}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const vqdMatch = tokenRes.data.match(/vqd=([\d-]+)/);
      if (!vqdMatch) return reply("❌ Search token එක ගන්න බැරි වුණා!");
      const vqd = vqdMatch[1];

      // 2. Fetch Images Data
      const imgRes = await axios.get(`https://duckduckgo.com/i.js?l=us-en&o=json&q=${encodeURIComponent(query)}&vqd=${vqd}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const results = imgRes.data.results;
      if (!results || results.length === 0) {
        return reply("❌ Image එකක් සොයාගැනීමට නොහැකි විය!");
      }

      // Pick a random HD image from top results
      const randomImg = results[Math.floor(Math.random() * Math.min(15, results.length))].image;

      await remember.sendMessage(
        from,
        {
          image: { url: randomImg },
          caption: `📌 *Image Result for:* "${query}"`
        },
        { quoted: mek }
      );

    } catch (e) {
      console.error(e);
      reply("❌ Image එක ගන්න ගිය වෙලාවේ දෝෂයක් ආවා. ආයෙත් Try කරන්න!");
    }
  }
);
