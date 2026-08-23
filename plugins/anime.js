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

// 1. HENTAI IMAGE WITH CUSTOM CAPTIONS (.hentai)
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
      // 1. Image API එකෙන් ගන්නවා
      const res = await axios.get("https://api.waifu.pics/nsfw/waifu", { timeout: 8000 });
      if (!res.data || !res.data.url) return reply("❌ API fetch failed.");

      const imgBuffer = await getBuffer(res.data.url);
      if (!imgBuffer) return reply("❌ Image download failed.");

      // 2. Random Captions
      const titles = [
        "Frieren used magic [Frieren: Beyond Journey's End]",
        "Naruto & Sasuke Special Scene",
        "Waifu Special Moment",
        "Anime NSFW Art Collection",
        "Ecchi Moment #1",
        "Hot Anime Scene"
      ];
      const randomTitle = titles[Math.floor(Math.random() * titles.length)];

      // 3. යවනකොට Title එක Caption එකට දාලා යවනවා
      await remember.sendMessage(
        from, 
        { image: imgBuffer, caption: `🔞 *${randomTitle}*` }, 
        { quoted: mek }
      );
    } catch (err) {
      reply(`❌ Error: ${err.message}`);
    }
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
