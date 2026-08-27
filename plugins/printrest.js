const { cmd } = require("../command");
const axios = require("axios");

// PINTEREST / IMAGE SEARCH (.pin / .pinterest)
cmd(
  {
    pattern: "pinterest",
    alias: ["pin", "pins", "img"],
    react: "📌",
    desc: "Search and download images",
    category: "download",
    filename: __filename
  },
  async (remember, mek, m, { from, reply, args }) => {
    try {
      const query = args.join(" ");
      if (!query) return reply("❌ කරුණාකර සෙවිය යුතු නම ලබාදෙන්න!\n\nEx: `.pin naruto wallpaper`");

      reply(`⏳ *"${query}" සඳහා Images සෙවුම් කරමින් පවතී...*`);

      let imageUrl = null;

      // API 1: DavidCyril Pinterest Search API
      try {
        const res1 = await axios.get(`https://api.davidcyriltech.my.id/pinterest?query=${encodeURIComponent(query)}`, { timeout: 10000 });
        if (res1.data && res1.data.status === 200 && res1.data.result && res1.data.result.length > 0) {
          const results = res1.data.result;
          imageUrl = results[Math.floor(Math.random() * results.length)];
        }
      } catch (e) {}

      // API 2: BK9 Pinterest API (Backup)
      if (!imageUrl) {
        try {
          const res2 = await axios.get(`https://bk9.fun/pinterest/search?q=${encodeURIComponent(query)}`, { timeout: 10000 });
          if (res2.data && res2.data.status && res2.data.BK9 && res2.data.BK9.length > 0) {
            const results = res2.data.BK9;
            imageUrl = results[Math.floor(Math.random() * results.length)].images_url || results[Math.floor(Math.random() * results.length)];
          }
        } catch (e) {}
      }

      // API 3: Unsplash HD Image Search (Final Fallback - Always Works!)
      if (!imageUrl) {
        try {
          const res3 = await axios.get(`https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&client_id=b42f317208d0e5b742e680e008427042a92a953974628d447f52a6515b076b36`, { timeout: 10000 });
          if (res3.data && res3.data.urls && res3.data.urls.regular) {
            imageUrl = res3.data.urls.regular;
          }
        } catch (e) {}
      }

      if (!imageUrl) return reply("❌ Server අවුලක් නිසා Image එක සොයාගැනීමට නොහැකි විය. පස්සේ උත්සාහ කරන්න!");

      // Send Image
      await remember.sendMessage(
        from,
        {
          image: { url: imageUrl },
          caption: `📌 *Image Result:* "${query}"`
        },
        { quoted: mek }
      );

    } catch (e) {
      console.error(e);
      reply("❌ Image Search කිරීමේදී දෝෂයක් සිදු විය!");
    }
  }
);
