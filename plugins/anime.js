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

// 1. HENTAI IMAGE WITH 6 APIS & CUSTOM CAPTIONS (.hentai)
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

    // API 5: Reddit Meme-API (r/hentai)
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

    if (!imgUrl) return reply("❌ All 6 servers are busy. Please try again in a few seconds!");

    const imgBuffer = await getBuffer(imgUrl);
    if (!imgBuffer) return reply("❌ Image download failed.");

    // Custom Titles Array
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

// 2. HENTAI MP4 VIDEO (.hentaivid)
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
