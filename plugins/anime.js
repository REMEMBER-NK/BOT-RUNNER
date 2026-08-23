const { cmd } = require("../command");
const https = require("https");

// Native HTTPS Fetcher (Cloudflare / Block Bypass)
function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json'
      }
    };

    https.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(JSON.parse(data));
          } else {
            reject(new Error(`HTTP ${res.statusCode}`));
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', err => reject(err));
  });
}

// Native HTTPS Buffer Fetcher for Images
function fetchBuffer(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    };

    https.get(url, options, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchBuffer(res.headers.location).then(resolve).catch(reject);
      }
      
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(Buffer.concat(chunks));
        } else {
          reject(new Error(`Image HTTP ${res.statusCode}`));
        }
      });
    }).on('error', err => reject(err));
  });
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
      
      const data = await fetchJSON(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(q)}&limit=1`);
      if (!data || !data.data || data.data.length === 0) return reply("❌ Anime not found.");

      const anime = data.data[0];
      const text = `📺 *Title:* ${anime.title}\n📝 *Episodes:* ${anime.episodes || "?"}\n⭐ *Rating:* ${anime.score || "?"}\n🎭 *Genres:* ${anime.genres.map(g => g.name).join(", ")}`;

      const imgBuffer = await fetchBuffer(anime.images.jpg.image_url);
      await danuwa.sendMessage(from, { image: imgBuffer, caption: text }, { quoted: mek });
    } catch (err) {
      reply(`❌ Anime Error: ${err.message}`);
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
      const data = await fetchJSON("https://api.waifu.im/search");
      if (!data || !data.images || !data.images[0]) return reply("❌ Waifu API Empty.");

      const imgBuffer = await fetchBuffer(data.images[0].url);
      await danuwa.sendMessage(from, { image: imgBuffer, caption: "🎴 *Waifu*" }, { quoted: mek });
    } catch (err) {
      reply(`❌ Waifu Error: ${err.message}`);
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
      const data = await fetchJSON("https://nekos.best/api/v2/neko");
      if (!data || !data.results || !data.results[0]) return reply("❌ Neko API Empty.");

      const imgBuffer = await fetchBuffer(data.results[0].url);
      await danuwa.sendMessage(from, { image: imgBuffer, caption: "🐱 *Neko*" }, { quoted: mek });
    } catch (err) {
      reply(`❌ Neko Error: ${err.message}`);
    }
  }
);
