const { cmd } = require("../command");
const axios = require("axios");

// Safe Buffer Downloader with Timeout
async function getBuffer(url) {
  try {
    const res = await axios.get(url, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });
    return Buffer.from(res.data, 'binary');
  } catch (e) {
    return null;
  }
}

// 1. ANIME SEARCH (Jikan API)
cmd(
  {
    pattern: "anime",
    react: "📺",
    desc: "Search anime details",
    category: "anime",
    filename: __filename
  },
  async (danuwa, mek, m, { from, q, reply }) => {
    try {
      if (!q) return reply("❌ Provide anime name. Example: .anime Naruto");
      
      const res = await axios.get(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(q)}&limit=1`, { timeout: 8000 });
      const data = res.data;

      if (!data || !data.data || data.data.length === 0) return reply("❌ Anime not found.");

      const anime = data.data[0];
      const text = `📺 *Title:* ${anime.title}\n📝 *Episodes:* ${anime.episodes || "?"}\n⭐ *Rating:* ${anime.score || "?"}\n🎭 *Genres:* ${anime.genres.map(g => g.name).join(", ")}`;

      const imgBuffer = await getBuffer(anime.images.jpg.image_url);
      if (imgBuffer) {
        await danuwa.sendMessage(from, { image: imgBuffer, caption: text }, { quoted: mek });
      } else {
        await danuwa.sendMessage(from, { text }, { quoted: mek });
      }
    } catch (err) {
      reply(`❌ Error: ${err.message}`);
    }
  }
);

// 2. WAIFU
cmd(
  {
    pattern: "waifu",
    react: "🎴",
    desc: "Send a random waifu image",
    category: "anime",
    filename: __filename
  },
  async (danuwa, mek, m, { from, reply }) => {
    try {
      const res = await axios.get("https://api.catboys.com/img", { timeout: 8000 });
      const imageUrl = res.data.url;

      const imgBuffer = await getBuffer(imageUrl);
      if (!imgBuffer) return reply("❌ Download failed.");

      await danuwa.sendMessage(
        from,
        { image: imgBuffer, caption: "🎴 *Waifu / Anime Pic*" },
        { quoted: mek }
      );
    } catch (err) {
      reply(`❌ Error: ${err.message}`);
    }
  }
);

// 3. NEKO
cmd(
  {
    pattern: "neko",
    react: "🐱",
    desc: "Send a random neko image",
    category: "anime",
    filename: __filename
  },
  async (danuwa, mek, m, { from, reply }) => {
    try {
      const res = await axios.get("https://nekos.best/api/v2/neko", { timeout: 8000 });
      const imageUrl = res.data.results[0].url;

      const imgBuffer = await getBuffer(imageUrl);
      if (!imgBuffer) return reply("❌ Download failed.");

      await danuwa.sendMessage(
        from,
        { image: imgBuffer, caption: "🐱 *Neko*" },
        { quoted: mek }
      );
    } catch (err) {
      reply(`❌ Error: ${err.message}`);
    }
  }
);

// 4. HENTAI (NSFW - Working API)
cmd(
  {
    // 4. HENTAI (NSFW - 100% Stable API)
cmd(
  {
    pattern: "hentai",
    react: "🔞",
    desc: "Send NSFW Hentai image",
    category: "anime",
    filename: __filename
  },
  async (danuwa, mek, m, { from, reply }) => {
    try {
      const res = await axios.get("https://purrbot.site/api/img/nsfw/hentai/gif", { timeout: 8000 });
      const imageUrl = res.data.link;

      if (!imageUrl) return reply("❌ Failed to fetch NSFW image.");

      const imgBuffer = await getBuffer(imageUrl);
      if (!imgBuffer) return reply("❌ Download failed.");

      await danuwa.sendMessage(
        from,
        { video: imgBuffer, gifPlayback: true, caption: "🔞 *Hentai*" },
        { quoted: mek }
      );
    } catch (err) {
      reply(`❌ Error: ${err.message}`);
    }
  }
);
