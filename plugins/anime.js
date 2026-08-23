const { cmd } = require("../command");
const axios = require("axios");

// Safe Buffer Downloader with Reddit/403 Bypass Headers
async function getBuffer(url) {
  try {
    const res = await axios.get(url, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.reddit.com/'
      },
      timeout: 20000
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

// 2. WAIFU
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

// 3. HENTAI IMAGE
cmd(
  {
    pattern: "hentai",
    react: "🔞",
    desc: "Send NSFW Hentai image",
    category: "anime",
    filename: __filename
  },
  async (remember, mek, m, { from, reply }) => {
    try {
      const res = await axios.get("https://meme-api.com/gimme/hentai", { timeout: 8000 });
      if (!res.data || !res.data.url) return reply("❌ Image fetch failed.");

      const imgBuffer = await getBuffer(res.data.url);
      if (!imgBuffer) return reply("❌ Image download failed.");

      const title = res.data.title ? res.data.title : "Hentai";

      await remember.sendMessage(
        from, 
        { image: imgBuffer, caption: `🔞 *${title}*` }, 
        { quoted: mek }
      );
    } catch (err) {
      reply(`❌ Error: ${err.message}`);
    }
  }
);

// 4. HENTAI VIDEO (403 Bypass Endpoint)
cmd(
  {
    pattern: "hentaivid",
    react: "🎥",
    desc: "Send NSFW Hentai Video",
    category: "anime",
    filename: __filename
  },
  async (remember, mek, m, { from, reply }) => {
    try {
      reply("⏳ *Downloading Hentai Video...*");

      // Stable Direct Video API with Zero Cloudflare / Reddit 403 Block
      const res = await axios.get("https://api.vreden.my.id/api/hentaivid", { timeout: 12000 });
      
      let videoUrl = res.data?.result?.video_1 || res.data?.result?.video_2 || res.data?.url;

      if (!videoUrl) {
        // Alternative Direct Engine
        const altRes = await axios.get("https://nekos.best/api/v2/husbando", { timeout: 8000 });
        videoUrl = altRes.data?.results[0]?.url;
      }

      const vidBuffer = await getBuffer(videoUrl);
      if (!vidBuffer) return reply("❌ Video download failed.");

      await remember.sendMessage(
        from, 
        { video: vidBuffer, caption: "🎥 *Hentai Video*", gifPlayback: true }, 
        { quoted: mek }
      );
    } catch (err) {
      reply(`❌ Error: ${err.message}`);
    }
  }
);
