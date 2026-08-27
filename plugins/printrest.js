const { cmd } = require("../command");
const axios = require("axios");

// PINTEREST IMAGE SEARCH (.pinterest <text>)
cmd(
  {
    pattern: "pinterest",
    alias: ["pin", "pins"],
    react: "📌",
    desc: "Search and download images from Pinterest",
    category: "download",
    filename: __filename
  },
  async (remember, mek, m, { from, reply, args }) => {
    try {
      const query = args.join(" ");
      if (!query) return reply("❌ කරුණාකර සෙවිය යුතු නම ලබාදෙන්න!\n\nEx: `.pin naruto hd wallpaper`");

      reply(`⏳ *"${query}" සඳහා Pinterest හි සෙවුම් කරමින් පවතී...*`);

      let imageUrl = null;

      // Primary Search API
      try {
        const res1 = await axios.get(`https://api.guruapi.tech/api/pinterest?query=${encodeURIComponent(query)}`, { timeout: 12000 });
        if (res1.data && res1.data.result && res1.data.result.length > 0) {
          // Random image from top results
          const results = res1.data.result;
          imageUrl = results[Math.floor(Math.random() * results.length)];
        }
      } catch (e) {}

      // Backup Search API (If 1st API fails)
      if (!imageUrl) {
        try {
          const res2 = await axios.get(`https://api.vyturex.com/pinterest?query=${encodeURIComponent(query)}`, { timeout: 12000 });
          if (res2.data && Array.isArray(res2.data) && res2.data.length > 0) {
            imageUrl = res2.data[Math.floor(Math.random() * res2.data.length)];
          }
        } catch (e) {}
      }

      if (!imageUrl) return reply("❌ ඔයා හොයපු නමට අදාළ Images හමු වුණේ නැත. වෙනත් නමක් ටයිප් කරන්න!");

      // Send Image
      await remember.sendMessage(
        from,
        {
          image: { url: imageUrl },
          caption: `📌 *Pinterest Search:* "${query}"`
        },
        { quoted: mek }
      );

    } catch (e) {
      console.error(e);
      reply("❌ Pinterest Search කිරීමේදී දෝෂයක් සිදු විය!");
    }
  }
);
