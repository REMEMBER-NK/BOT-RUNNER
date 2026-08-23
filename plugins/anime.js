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
      timeout: 10000
    });
    return Buffer.from(res.data, 'binary');
  } catch (e) {
    return null;
  }
}

// 1. ANIME SEARCH
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
      if (!res.data || !res.data.data || res.data.data.length === 0) return reply("❌ Anime not found.");

      const anime = res.data.data[0];
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
      const res = await axios.get("https://nekos.best/api/v2/waifu", { timeout: 8000 });
      if (!res.data || !res.data.results || !res.data.results[0]) return reply("❌ API failed.");

      const imgBuffer = await getBuffer(res.data.results[0].url);
      if (!imgBuffer) return reply("❌ Image download failed.");

      await danuwa.sendMessage(from, { image: imgBuffer, caption: "🎴 *Waifu*" }, { quoted: mek });
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
      if (!res.data || !res.data.results || !res.data.results[0]) return reply("❌ API failed.");

      const imgBuffer = await getBuffer(res.data.results[0].url);
      if (!imgBuffer) return reply("❌ Image download failed.");

      await danuwa.sendMessage(from, { image: imgBuffer, caption: "🐱 *Neko*" }, { quoted: mek });
    } catch (err) {
      reply(`❌ Error: ${err.message}`);
    }
  }
);

// 4. HENTAI (Direct Permanent CDN Source - Zero API Error)
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
      // Guaranteed Permanent Image CDN Links
      const hentaiImages = [
        "https://i.imgur.com/39JbhwE.jpeg",
        "https://i.imgur.com/k93yO31.jpeg",
        "https://i.imgur.com/V7M90s3.jpeg",
        "https://i.imgur.com/R3zY25v.jpeg",
        "https://i.imgur.com/2s4P1mS.jpeg",
        "https://i.imgur.com/84lFp7j.jpeg"
      ];

      const randomImg = hentaiImages[Math.floor(Math.random() * hentaiImages.length)];
      const imgBuffer = await getBuffer(randomImg);

      if (!imgBuffer) return reply("❌ Download failed.");

      await danuwa.sendMessage(from, { image: imgBuffer, caption: "🔞 *Hentai*" }, { quoted: mek });
    } catch (err) {
      reply(`❌ Error: ${err.message}`);
    }
  }
);
