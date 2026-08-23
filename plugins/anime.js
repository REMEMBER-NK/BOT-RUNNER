const { cmd } = require("../command");

// Built-in fetch or standard JSON fetch handler
async function getJSON(url) {
  try {
    const res = await fetch(url);
    return res.ok ? await res.json() : null;
  } catch (e) {
    console.error("API Fetch Error:", e);
    return null;
  }
}

const waifuEndpoints = {
  waifu: "https://api.waifu.pics/sfw/waifu",
  husbando: "https://api.waifu.pics/sfw/husbando",
  neko: "https://api.waifu.pics/sfw/neko",
  animegirl: "https://api.waifu.pics/sfw/waifu",
  animeboy: "https://api.waifu.pics/sfw/waifu",
  kitsune: "https://api.waifu.pics/sfw/kitsune",
  hentaigif: "https://api.waifu.pics/nsfw/waifu",
  hentai: "https://api.waifu.pics/nsfw/neko"
};

for (const [cmdName, url] of Object.entries(waifuEndpoints)) {
  cmd(
    {
      pattern: cmdName,
      react: "🎴",
      desc: `Send a random ${cmdName} image`,
      category: "anime",
      filename: __filename
    },
    async (danuwa, mek, m, { from, reply }) => {
      const data = await getJSON(url);
      if (!data || !data.url) return reply("❌ Failed to fetch image.");
      await danuwa.sendMessage(
        from,
        { image: { url: data.url }, caption: `🎴 *${cmdName}*` },
        { quoted: mek }
      );
    }
  );
}

cmd(
  {
    pattern: "anime",
    react: "📺",
    desc: "Search anime details",
    category: "anime",
    filename: __filename
  },
  async (danuwa, mek, m, { from, q, reply }) => {
    if (!q) return reply("❌ Provide anime name. Example: .anime Naruto");
    const data = await getJSON(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(q)}&limit=1`);
    if (!data || !data.data || data.data.length === 0) return reply("❌ Anime not found.");
    const anime = data.data[0];
    const text = `📺 *Title:* ${anime.title}\n📝 *Episodes:* ${anime.episodes || "?"}\n⭐ *Rating:* ${anime.score || "?"}\n🎭 *Genres:* ${anime.genres.map(g => g.name).join(", ")}`;
    await danuwa.sendMessage(from, { text }, { quoted: mek });
  }
);

cmd(
  {
    pattern: "manga",
    react: "📖",
    desc: "Search manga info",
    category: "anime",
    filename: __filename
  },
  async (danuwa, mek, m, { from, q, reply }) => {
    if (!q) return reply("❌ Provide manga name. Example: .manga One Piece");
    const data = await getJSON(`https://api.jikan.moe/v4/manga?q=${encodeURIComponent(q)}&limit=1`);
    if (!data || !data.data || data.data.length === 0) return reply("❌ Manga not found.");
    const manga = data.data[0];
    const text = `📖 *Title:* ${manga.title}\n📝 *Chapters:* ${manga.chapters || "?"}\n⭐ *Rating:* ${manga.score || "?"}\n🎭 *Genres:* ${manga.genres.map(g => g.name).join(", ")}`;
    await danuwa.sendMessage(from, { text }, { quoted: mek });
  }
);

cmd(
  {
    pattern: "character",
    react: "👤",
    desc: "Get anime character info",
    category: "anime",
    filename: __filename
  },
  async (danuwa, mek, m, { from, q, reply }) => {
    if (!q) return reply("❌ Provide character name. Example: .character Naruto");
    const data = await getJSON(`https://api.jikan.moe/v4/characters?q=${encodeURIComponent(q)}&limit=1`);
    if (!data || !data.data || data.data.length === 0) return reply("❌ Character not found.");
    const char = data.data[0];
    const text = `👤 *Name:* ${char.name}\n💖 *Anime:* ${char.anime.map(a => a.anime.title).slice(0,5).join(", ")}`;
    await danuwa.sendMessage(from, { text }, { quoted: mek });
  }
);

cmd(
  {
    pattern: "waifuquote",
    react: "💌",
    desc: "Quote from random waifu",
    category: "anime",
    filename: __filename
  },
  async (danuwa, mek, m, { from, reply }) => {
    const data = await getJSON("https://api.waifu.pics/sfw/waifu");
    if (!data || !data.url) return reply("❌ Could not fetch waifu quote image.");
    await danuwa.sendMessage(from, { image: { url: data.url }, caption: "💌 Waifu Quote" }, { quoted: mek });
  }
);

cmd(
  {
    pattern: "animefact",
    react: "🤔",
    desc: "Random anime fact",
    category: "anime",
    filename: __filename
  },
  async (danuwa, mek, m, { from }) => {
    const facts = [
      "Naruto’s Naruto Ramen is based on a real Japanese dish.",
      "Attack on Titan’s Titans were inspired by the author’s nightmares.",
      "In One Piece, Luffy’s hat was inspired by a real straw hat."
    ];
    const fact = facts[Math.floor(Math.random() * facts.length)];
    await danuwa.sendMessage(from, { text: `🤔 *Anime Fact:* ${fact}` }, { quoted: mek });
  }
);
