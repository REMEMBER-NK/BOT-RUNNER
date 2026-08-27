const { cmd } = require("../command");
const axios = require("axios");

// 100% WORKING IMAGE SEARCH (.pin / .img)
cmd(
  {
    pattern: "pinterest",
    alias: ["pin", "pins", "img", "image"],
    react: "📌",
    desc: "Search and download HD images",
    category: "download",
    filename: __filename
  },
  async (remember, mek, m, { from, reply, args }) => {
    try {
      const query = args.join(" ");
      if (!query) return reply("❌ කරුණාකර සෙවිය යුතු නම ලබාදෙන්න!\n\nEx: `.pin naruto wallpaper`");

      reply(`⏳ *"${query}" සඳහා Image එකක් සොයමින් පවතී...*`);

      let imageUrl = null;

      // Method 1: Siputzx Pinterest API
      try {
        const res1 = await axios.get(`https://api.siputzx.my.id/api/s/pinterest?query=${encodeURIComponent(query)}`, { timeout: 8000 });
        if (res1.data && res1.data.status && res1.data.data && res1.data.data.length > 0) {
          const arr = res1.data.data;
          imageUrl = arr[Math.floor(Math.random() * arr.length)].images_url || arr[Math.floor(Math.random() * arr.length)];
        }
      } catch (e) {}

      // Method 2: Widipe Pinterest Search (Backup)
      if (!imageUrl) {
        try {
          const res2 = await axios.get(`https://widipe.com/pinterest?q=${encodeURIComponent(query)}`, { timeout: 8000 });
          if (res2.data && res2.data.result && res2.data.result.length > 0) {
            const arr = res2.data.result;
            imageUrl = arr[Math.floor(Math.random() * arr.length)];
          }
        } catch (e) {}
      }

      // Method 3: Pollinations AI Direct Generator (Final Fallback - Always Generates Image)
      if (!imageUrl) {
        imageUrl = `https://pollinations.ai/p/${encodeURIComponent(query)}?width=1080&height=1080&seed=${Math.floor(Math.random() * 1000)}`;
      }

      // Send Image
      await remember.sendMessage(
        from,
        {
          image: { url: imageUrl },
          caption: `📌 *Image Result for:* "${query}"`
        },
        { quoted: mek }
      );

    } catch (e) {
      console.error(e);
      reply("❌ Image එක සොයාගැනීමේදී දෝෂයක් සිදු විය!");
    }
  }
);
