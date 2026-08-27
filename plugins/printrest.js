const { cmd } = require("../command");
const axios = require("axios");

// Safe Buffer Downloader with Image Verification
async function getBuffer(url) {
  try {
    const res = await axios.get(url, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
      },
      timeout: 15000
    });
    
    // Check if the response is actually an image
    const contentType = res.headers['content-type'] || '';
    if (contentType.includes('image')) {
      return Buffer.from(res.data);
    }
    return null;
  } catch (e) {
    return null;
  }
}

// 100% WORKING & TESTED IMAGE SEARCH (.pin / .img / .pinterest)
cmd(
  {
    pattern: "pinterest",
    alias: ["pin", "pins", "img", "image"],
    react: "📌",
    desc: "Search and download HD images",
    category: "download",
    filename: __filename
  },
  async (remember, mek, m, { from, reply, args }) => {
    try {
      const query = args.join(" ");
      if (!query) return reply("❌ කරුණාකර සෙවිය යුතු නම ලබාදෙන්න!\n\nEx: `.pin naruto wallpaper`");

      reply(`⏳ *"${query}" සඳහා Image එකක් සොයමින් පවතී...*`);

      let imgUrls = [];

      // API 1: Siputzx Pinterest API
      try {
        const res1 = await axios.get(`https://api.siputzx.my.id/api/s/pinterest?query=${encodeURIComponent(query)}`, { timeout: 8000 });
        if (res1.data && res1.data.status && Array.isArray(res1.data.data)) {
          imgUrls = res1.data.data.map(item => typeof item === 'string' ? item : item.images_url || item.url).filter(Boolean);
        }
      } catch (e) {}

      // API 2: Widipe Search (Backup)
      if (imgUrls.length === 0) {
        try {
          const res2 = await axios.get(`https://widipe.com/pinterest?q=${encodeURIComponent(query)}`, { timeout: 8000 });
          if (res2.data && Array.isArray(res2.data.result)) {
            imgUrls = res2.data.result;
          }
        } catch (e) {}
      }

      // API 3: BK9 Pinterest API (Backup 2)
      if (imgUrls.length === 0) {
        try {
          const res3 = await axios.get(`https://bk9.fun/pinterest/search?q=${encodeURIComponent(query)}`, { timeout: 8000 });
          if (res3.data && res3.data.status && Array.isArray(res3.data.BK9)) {
            imgUrls = res3.data.BK9.map(item => typeof item === 'string' ? item : item.images_url || item.url).filter(Boolean);
          }
        } catch (e) {}
      }

      if (imgUrls.length === 0) {
        return reply("❌ සොයන නමට අදාළ Images හමු වුණේ නැත!");
      }

      // Shuffle and try downloading valid image buffer
      let imgBuffer = null;
      let attempts = 0;
      
      while (!imgBuffer && attempts < 5 && imgUrls.length > 0) {
        const randomIndex = Math.floor(Math.random() * imgUrls.length);
        const selectedUrl = imgUrls.splice(randomIndex, 1)[0];
        imgBuffer = await getBuffer(selectedUrl);
        attempts++;
      }

      if (!imgBuffer) {
        return reply("❌ Image එක ඩවුන්ලෝඩ් කිරීමේදී දෝෂයක් ආවා. වෙනත් නමක් ටයිප් කර බලන්න!");
      }

      // Send Valid Buffer Image
      await remember.sendMessage(
        from,
        {
          image: imgBuffer,
          caption: `📌 *Image Result for:* "${query}"`
        },
        { quoted: mek }
      );

    } catch (e) {
      console.error(e);
      reply("❌ Image එක සොයාගැනීමේදී දෝෂයක් සිදු විය!");
    }
  }
);
