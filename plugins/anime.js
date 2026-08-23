const { cmd } = require("../command");
const axios = require("axios");

// Buffer එකක් විදිහට Image / Data ගන්න Helper Function එක
async function getBuffer(url) {
  try {
    const res = await axios.get(url, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      },
      timeout: 15000
    });
    return Buffer.from(res.data, 'binary');
  } catch (e) {
    console.error("Buffer Fetch Error:", e.message);
    return null;
  }
}

// JSON Data ගන්න Helper Function එක
async function getJSON(url) {
  try {
    const res = await axios.get(url, { timeout: 10000 });
    return res.data;
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
      
      const data = await getJSON(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(q)}&limit=1`);
      
      if (!data || !data.data || data.data.length === 0) {
        return reply("❌ Anime not found.");
      }

      const anime = data.data[0];
      const text = `📺 *Title:* ${anime.title}\n📝 *Episodes:* ${anime.episodes || "?"}\n⭐ *Rating:* ${anime.score || "?"}\n🎭 *Genres:* ${anime.genres.map(g => g.name).join(", ")}`;

      const imgBuffer = await getBuffer(anime.images.jpg.image_url);
      
      if (!imgBuffer) return reply(text); // Image එක බැරි වුණොත් Text එක විතරක් යවනවා

      await danuwa.sendMessage(
        from, 
        { image: imgBuffer, caption: text }, 
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
      if (!data || !data.images || !data.images[0]) return reply("❌ API Response Failed.");

      const imgBuffer = await getBuffer(data.images[0].url);
      if (!imgBuffer) return reply("❌ Failed to download image buffer.");

      await danuwa.sendMessage(
        from,
        { image: imgBuffer, caption: "🎴 *Waifu*" },
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
      if (!data || !data.results || !data.results[0]) return reply("❌ API Response Failed.");

      const imgBuffer = await getBuffer(data.results[0].url);
      if (!imgBuffer) return reply("❌ Failed to download image buffer.");

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
