const { cmd } = require("../command");
const axios = require("axios");

// Safe Buffer Downloader - Strict Max 4MB Limit
async function getBuffer(url) {
  try {
    const res = await axios.get(url, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 8000 // Fast Timeout (8 Sec)
    });

    const buffer = Buffer.from(res.data, 'binary');
    // File size එක MB 4ට වඩා වැඩිනම් Skip කරලා Fast images විතරක් ගන්නවා
    if (buffer.length > 4 * 1024 * 1024) return null; 

    return buffer;
  } catch (e) {
    return null;
  }
}

// 1. FAST HENTAI IMAGE (.hentai)
cmd(
  {
    pattern: "hentai",
    react: "🔞",
    desc: "Send Fast Anime Hentai Image",
    category: "anime",
    filename: __filename
  },
  async (remember, mek, m, { from, reply }) => {
    let imgBuffer = null;

    // Fast API List
    const apiList = [
      "https://nekos.best/api/v2/hentai",
      "https://api.waifu.pics/nsfw/waifu",
      "https://api.waifu.im/search?is_nsfw=true&gif=false",
      "https://nekos.life/api/v2/img/hentai"
    ];

    // Loop through APIs until a light/fast image (<4MB) is found
    for (const api of apiList) {
      try {
        const res = await axios.get(api, { timeout: 4000 });
        let url = null;

        if (res.data.results && res.data.results[0]) url = res.data.results[0].url;
        else if (res.data.url) url = res.data.url;
        else if (res.data.images && res.data.images[0]) url = res.data.images[0].url;

        if (url) {
          imgBuffer = await getBuffer(url);
          if (imgBuffer) break; // MB 4ට අඩු Fast Image එකක් හම්බුණ ගමන් Loop එක නවත්තනවා
        }
      } catch (e) {
        continue;
      }
    }

    if (!imgBuffer) return reply("❌ Fast image retrieval failed. Please try again!");

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
      reply("⏳ *Sending Video...*");

      const hentaiVideos = [
        "https://files.catbox.moe/rtyzi7.mp4"
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
