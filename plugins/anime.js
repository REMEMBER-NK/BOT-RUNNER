const { cmd } = require("../command");
const axios = require("axios");

// Safe API Fetcher using Axios
async function getJSON(url) {
  try {
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000 // 10s Timeout
    });
    return res.data;
  } catch (e) {
    console.error("API Fetch Error:", e.message);
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
      
      const data = await getJSON(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(q)}&limit=1`);
      
      if (!data || !data.data || data.data.length === 0) {
        return reply("❌ Anime not found.");
      }

      const anime = data.data[0];
      const text = `📺 *Title:* ${anime.title}\n📝 *Episodes:* ${anime.episodes || "?"}\n⭐ *Rating:* ${anime.score || "?"}\n🎭 *Genres:* ${anime.genres.map(g => g.name).join(", ")}`;

      await danuwa.sendMessage(
        from, 
        { image: { url: anime.images.jpg.image_url }, caption: text }, 
        { quoted: mek }
      );
    } catch (err) {
      reply(`❌ Error: ${err.message}`);
    }
  }
);

// 2. WAIFU IMAGE
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
      const data = await getJSON("https://api.waifu.im/search?included_tags=waifu");
      if (!data || !data.images || !data.images[0]) return reply("❌ Failed to fetch image.");

      await danuwa.sendMessage(
        from,
        { image: { url: data.images[0].url }, caption: "🎴 *Waifu*" },
        { quoted: mek }
      );
    } catch (err) {
      reply(`❌ Error: ${err.message}`);
    }
  }
);

// 3. NEKO IMAGE
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
      const data = await getJSON("https://nekos.best/api/v2/neko");
      if (!data || !data.results || !data.results[0]) return reply("❌ Failed to fetch image.");

      await danuwa.sendMessage(
        from,
        { image: { url: data.results[0].url }, caption: "🐱 *Neko*" },
        { quoted: mek }
      );
    } catch (err) {
      reply(`❌ Error: ${err.message}`);
    }
  }
);

// 4. HENTAI (NSFW Waifu)
cmd(
  {
    pattern: "hentai",
    react: "🔞",
    desc: "Send NSFW image",
    category: "anime",
    filename: __filename
  },
  async (danuwa, mek, m, { from, reply }) => {
    try {
      const data = await getJSON("https://api.waifu.im/search?is_nsfw=true");
      if (!data || !data.images || !data.images[0]) return reply("❌ Failed to fetch image.");

      await danuwa.sendMessage(
        from,
        { image: { url: data.images[0].url }, caption: "🔞 *Hentai*" },
        { quoted: mek }
      );
    } catch (err) {
      reply(`❌ Error: ${err.message}`);
    }
  }
);
