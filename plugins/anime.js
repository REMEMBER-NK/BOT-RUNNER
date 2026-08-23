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
      timeout: 25000
    });
    return Buffer.from(res.data, 'binary');
  } catch (e) {
    return null;
  }
}

// 1. ANIME SEARCH (.anime)
cmd(
  {
    pattern: "anime",
    react: "📺",
    desc: "Search anime details",
    category: "anime",
    filename: __filename
  },
  async (remember, mek, m, { from, q, reply }) => {
    try {
      if (!q) return reply("❌ Provide anime name. Example: .anime Naruto");
      
      const res = await axios.get(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(q)}&limit=1`, { timeout: 8000 });
      if (!res.data || !res.data.data || res.data.data.length === 0) return reply("❌ Anime not found.");

      const anime = res.data.data[0];
      const text = `📺 *Title:* ${anime.title}\n📝 *Episodes:* ${anime.episodes || "?"}\n⭐ *Rating:* ${anime.score || "?"}\n🎭 *Genres:* ${anime.genres.map(g => g.name).join(", ")}`;

      const imgBuffer = await getBuffer(anime.images.jpg.image_url);
      if (imgBuffer) {
        await remember.sendMessage(from, { image: imgBuffer, caption: text }, { quoted: mek });
      } else {
        await remember.sendMessage(from, { text }, { quoted: mek });
      }
    } catch (err) {
      reply(`❌ Error: ${err.message}`);
    }
  }
);

// 2. WAIFU (.waifu)
cmd(
  {
    pattern: "waifu",
    react: "🎴",
    desc: "Send a random waifu image",
    category: "anime",
    filename: __filename
  },
  async (remember, mek, m, { from, reply }) => {
    try {
      const res = await axios.get("https://nekos.best/api/v2/waifu", { timeout: 8000 });
      if (!res.data || !res.data.results || !res.data.results[0]) return reply("❌ API failed.");

      const imgBuffer = await getBuffer(res.data.results[0].url);
      if (!imgBuffer) return reply("❌ Image download failed.");

      await remember.sendMessage(from, { image: imgBuffer, caption: "🎴 *Waifu*" }, { quoted: mek });
    } catch (err) {
      reply(`❌ Error: ${err.message}`);
    }
  }
);

// 3. HENTAI IMAGE (.hentai)
cmd(
  {
    pattern: "hentai",
    react: "🔞",
    desc: "Send Anime Hentai Image",
    category: "anime",
    filename: __filename
  },
  async (remember, mek, m, { from, reply }) => {
    try {
      const res = await axios.get("https://api.waifu.pics/nsfw/waifu", { timeout: 8000 });
      if (!res.data || !res.data.url) return reply("❌ API fetch failed.");

      const imgBuffer = await getBuffer(res.data.url);
      if (!imgBuffer) return reply("❌ Image download failed.");

      await remember.sendMessage(
        from, 
        { image: imgBuffer, caption: "🔞 *Anime Hentai*" }, 
        { quoted: mek }
      );
    } catch (err) {
      reply(`❌ Error: ${err.message}`);
    }
  }
);

// 4. HENTAI VIDEO (.hentaivid)
cmd(
  {
    pattern: "hentaivid",
    react: "🎥",
    desc: "Send custom uploaded Hentai Video",
    category: "anime",
    filename: __filename
  },
  async (remember, mek, m, { from, reply }) => {
    try {
      reply("⏳ *Downloading Video...*");

      const hentaiVideos = [
        "http://file-to-link-stevebotz-01.koyeb.app/40694/713285885.mp4?hash=AgADTb"
      ];

      const selectedVid = hentaiVideos[Math.floor(Math.random() * hentaiVideos.length)];

      const vidBuffer = await getBuffer(selectedVid);
      if (!vidBuffer) return reply("❌ Video download failed. Link might be expired!");

      await remember.sendMessage(
        from, 
        { 
          video: vidBuffer, 
          caption: "🎥 *Hentai Video (MP4)*",
          mimetype: "video/mp4"
        }, 
        { quoted: mek }
      );
    } catch (err) {
      reply(`❌ Error: ${err.message}`);
    }
  }
);
