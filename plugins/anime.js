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

// 1. ANIME SEARCH (.anime) - FIXED WITH BACKUP API
cmd(
  {
    pattern: "anime",
    react: "📺",
    desc: "Search and get Anime details",
    category: "anime",
    filename: __filename
  },
  async (remember, mek, m, { from, reply, args }) => {
    try {
      const text = args.join(" ");
      if (!text) return reply("❌ කරුණාකර Anime එකක නමක් දෙන්න! (Ex: .anime naruto)");

      let animeData = null;

      // Primary API: Jikan API
      try {
        const res = await axios.get(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(text)}&limit=1`, { timeout: 15000 });
        if (res.data?.data?.[0]) {
          const item = res.data.data[0];
          animeData = {
            title: item.title,
            episodes: item.episodes || 'N/A',
            score: item.score || 'N/A',
            genres: item.genres ? item.genres.map(g => g.name).join(', ') : 'N/A',
            image: item.images.jpg.large_image_url
          };
        }
      } catch (err) {
        console.log("Jikan API failed, trying Kitsu API...");
      }

      // Backup API: Kitsu API (If Jikan fails)
      if (!animeData) {
        try {
          const kitsuRes = await axios.get(`https://kitsu.io/api/edge/anime?filter[text]=${encodeURIComponent(text)}`, { timeout: 15000 });
          if (kitsuRes.data?.data?.[0]) {
            const item = kitsuRes.data.data[0].attributes;
            animeData = {
              title: item.canonicalTitle,
              episodes: item.episodeCount || 'N/A',
              score: item.averageRating ? (item.averageRating / 10).toFixed(2) : 'N/A',
              genres: 'N/A',
              image: item.posterImage?.original || item.posterImage?.large
            };
          }
        } catch (err) {
          console.log("Kitsu API also failed.");
        }
      }

      if (!animeData) return reply("❌ ඔයා හොයපු Anime එක සොයාගැනීමට නොහැකි විය!");

      const caption = `📺 *Title:* ${animeData.title}\n` +
                      `📝 *Episodes:* ${animeData.episodes}\n` +
                      `⭐ *Rating:* ${animeData.score}\n` +
                      `🎭 *Genres:* ${animeData.genres}`;

      await remember.sendMessage(
        from,
        {
          image: { url: animeData.image },
          caption: caption
        },
        { quoted: mek }
      );

    } catch (e) {
      console.error(e);
      reply("❌ Anime details ගන්න කොට අවුලක් ආවා!");
    }
  }
);


// 2. HENTAI IMAGE WITH 6 APIS & CUSTOM CAPTIONS (.hentai)
cmd(
  {
    pattern: "hentai",
    react: "🔞",
    desc: "Send Anime Hentai Image",
    category: "anime",
    filename: __filename
  },
  async (remember, mek, m, { from, reply }) => {
    let imgUrl = null;

    // API 1: Waifu.pics
    try {
      const res1 = await axios.get("https://api.waifu.pics/nsfw/waifu", { timeout: 4000 });
      if (res1.data && res1.data.url) imgUrl = res1.data.url;
    } catch (e) {}

    // API 2: Nekos.best
    if (!imgUrl) {
      try {
        const res2 = await axios.get("https://nekos.best/api/v2/hentai", { timeout: 4000 });
        if (res2.data && res2.data.results && res2.data.results[0]) imgUrl = res2.data.results[0].url;
      } catch (e) {}
    }

    // API 3: Waifu.im
    if (!imgUrl) {
      try {
        const res3 = await axios.get("https://api.waifu.im/search?is_nsfw=true", { timeout: 4000 });
        if (res3.data && res3.data.images && res3.data.images[0]) imgUrl = res3.data.images[0].url;
      } catch (e) {}
    }

    // API 4: PurrBot
    if (!imgUrl) {
      try {
        const res4 = await axios.get("https://purrbot.site/api/img/nsfw/hentai/gif", { timeout: 4000 });
        if (res4.data && res4.data.link) imgUrl = res4.data.link;
      } catch (e) {}
    }

    // API 5: Reddit Meme-API
    if (!imgUrl) {
      try {
        const res5 = await axios.get("https://meme-api.com/gimme/hentai", { timeout: 4000 });
        if (res5.data && res5.data.url) imgUrl = res5.data.url;
      } catch (e) {}
    }

    // API 6: Akaneko API
    if (!imgUrl) {
      try {
        const res6 = await axios.get("https://nekos.life/api/v2/img/hentai", { timeout: 4000 });
        if (res6.data && res6.data.url) imgUrl = res6.data.url;
      } catch (e) {}
    }

    if (!imgUrl) return reply("❌ All image servers are busy. Try again!");

    const imgBuffer = await getBuffer(imgUrl);
    if (!imgBuffer) return reply("❌ Image download failed.");

    const titles = [
      "Frieren used magic [Frieren: Beyond Journey's End]",
      "Naruto & Sasuke Special Scene",
      "Waifu Special Moment",
      "Anime NSFW Art Collection",
      "Ecchi Moment #1",
      "Hot Anime Scene"
    ];
    const randomTitle = titles[Math.floor(Math.random() * titles.length)];

    await remember.sendMessage(
      from, 
      { image: imgBuffer, caption: `🔞 *${randomTitle}*` }, 
      { quoted: mek }
    );
  }
);

// 3. HENTAI MP4 VIDEO (.hentaivid)
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
      reply("⏳ *Sending Video...*");

      const hentaiVideos = [
        "https://theditch.st/hkn75equ",
        "https://files.catbox.moe/3ycpn4.mp4"
      ];

      const selectedVid = hentaiVideos[Math.floor(Math.random() * hentaiVideos.length)];

      await remember.sendMessage(
        from, 
        { 
          video: { url: selectedVid }, 
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
