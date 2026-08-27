const { cmd } = require("../command");
const axios = require("axios");

// Safe Buffer Downloader
async function getBuffer(url) {
  try {
    const res = await axios.get(url, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 15000
    });
    return Buffer.from(res.data, 'binary');
  } catch (e) {
    return null;
  }
}

// 100% FIXED IMAGE SEARCH (.pin / .img / .pinterest)
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

      // Method 1: Siputzx Pinterest Search
      try {
        const res1 = await axios.get(`https://api.siputzx.my.id/api/s/pinterest?query=${encodeURIComponent(query)}`, { timeout: 8000 });
        if (res1.data && res1.data.status && res1.data.data && res1.data.data.length > 0) {
          const arr = res1.data.data;
          const picked = arr[Math.floor(Math.random() * arr.length)];
          imageUrl = typeof picked === 'string' ? picked : picked.images_url || picked.url;
        }
      } catch (e) {}

      // Method 2: Widipe Search (Backup)
      if (!imageUrl) {
        try {
          const res2 = await axios.get(`https://widipe.com/pinterest?q=${encodeURIComponent(query)}`, { timeout: 8000 });
          if (res2.data && res2.data.result && res2.data.result.length > 0) {
            const arr = res2.data.result;
            imageUrl = arr[Math.floor(Math.random() * arr.length)];
          }
        } catch (e) {}
      }

      // Method 3: Pollinations AI Image (Final Fallback)
      if (!imageUrl) {
        imageUrl = `https://pollinations.ai/p/${encodeURIComponent(query)}?width=1080&height=1080&seed=${Math.floor(Math.random() * 1000)}`;
      }

      // Download Image to Buffer for Safe WhatsApp Sending
      const imgBuffer = await getBuffer(imageUrl);

      if (!imgBuffer) {
        // Fallback to Pollinations if buffer download failed
        const altUrl = `https://pollinations.ai/p/${encodeURIComponent(query)}?width=1080&height=1080&seed=${Math.floor(Math.random() * 1000)}`;
        const altBuffer = await getBuffer(altUrl);
        
        if (!altBuffer) return reply("❌ Image එක ඩවුන්ලෝඩ් කරගැනීමට නොහැකි විය. ආයෙත් Try කරන්න!");

        return await remember.sendMessage(
          from,
          { image: altBuffer, caption: `📌 *Image Result for:* "${query}"` },
          { quoted: mek }
        );
      }

      // Send Buffer Image
      await remember.sendMessage(
        from,
        {
          image: imgBuffer,
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
