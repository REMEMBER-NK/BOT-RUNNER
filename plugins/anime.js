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
      timeout: 15000 // Videos වලට Size වැඩි නිසා Timeout එක 15s කළා
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

// 3. HENTAI IMAGE
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
      const res = await axios.get("https://meme-api.com/gimme/hentai", { timeout: 8000 });
      if (!res.data || !res.data.url) return reply("❌ Image fetch failed.");

      const imgBuffer = await getBuffer(res.data.url);
      if (!imgBuffer) return reply("❌ Image download failed.");

      const title = res.data.title ? res.data.title : "Hentai";

      await danuwa.sendMessage(
        from, 
        { image: imgBuffer, caption: `🔞 *${title}*` }, 
        { quoted: mek }
      );
    } catch (err) {
      reply(`❌ Error: ${err.message}`);
    }
  }
);

// 4. HENTAI VIDEO (NEW)
cmd(
  {
    pattern: "hentaivid",
    react: "🎥",
    desc: "Send NSFW Hentai Video",
    category: "anime",
    filename: __filename
  },
  async (danuwa, mek, m, { from, reply }) => {
    try {
      reply("⏳ *Downloading Hentai Video...*");
      
      const res = await axios.get("https://purrbot.site/api/img/nsfw/hentai/gif", { timeout: 10000 });
      if (!res.data || !res.data.link) return reply("❌ Video fetch failed.");

      const vidBuffer = await getBuffer(res.data.link);
      if (!vidBuffer) return reply("❌ Video download failed.");

      await danuwa.sendMessage(
        from, 
        { video: vidBuffer, caption: "🎥 *Hentai Video / GIF*", gifPlayback: true }, 
        { quoted: mek }
      );
    } catch (err) {
      reply(`❌ Error: ${err.message}`);
    }
  }
);
