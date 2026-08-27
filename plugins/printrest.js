const { cmd } = require("../command");
const axios = require("axios");

// Safe Buffer Downloader
async function getBuffer(url) {
  try {
    const res = await axios.get(url, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/*'
      },
      timeout: 10000
    });
    return Buffer.from(res.data);
  } catch (e) {
    return null;
  }
}

// 10 MULTI-API BULLETPROOF IMAGE SEARCH (.pin / .img)
cmd(
  {
    pattern: "pinterest",
    alias: ["pin", "pins", "img", "image"],
    react: "📌",
    desc: "Search images using 10 fallback APIs",
    category: "download",
    filename: __filename
  },
  async (remember, mek, m, { from, reply, args }) => {
    try {
      const query = args.join(" ");
      if (!query) return reply("❌ කරුණාකර සෙවිය යුතු නම ලබාදෙන්න!\n\nEx: `.pin naruto wallpaper`");

      reply(`⏳ *"${query}" සඳහා Images සෙවුම් කරමින් පවතී...*`);

      const q = encodeURIComponent(query);
      let imgBuffer = null;

      // 10 FALLBACK API ENDPOINTS LIST
      const apiList = [
        // 1. Siputzx Pinterest API
        async () => {
          const r = await axios.get(`https://api.siputzx.my.id/api/s/pinterest?query=${q}`, { timeout: 6000 });
          const arr = r.data?.data;
          const picked = arr?.[Math.floor(Math.random() * arr.length)];
          return typeof picked === 'string' ? picked : picked?.images_url || picked?.url;
        },
        // 2. Lexica Art HD Search
        async () => {
          const r = await axios.get(`https://lexica.art/api/v1/search?q=${q}`, { timeout: 6000 });
          const arr = r.data?.images;
          return arr?.[Math.floor(Math.random() * Math.min(10, arr.length))]?.src;
        },
        // 3. BK9 Pinterest Search
        async () => {
          const r = await axios.get(`https://bk9.fun/pinterest/search?q=${q}`, { timeout: 6000 });
          const arr = r.data?.BK9;
          const picked = arr?.[Math.floor(Math.random() * arr.length)];
          return typeof picked === 'string' ? picked : picked?.images_url || picked?.url;
        },
        // 4. Widipe Pinterest API
        async () => {
          const r = await axios.get(`https://widipe.com/pinterest?q=${q}`, { timeout: 6000 });
          const arr = r.data?.result;
          return arr?.[Math.floor(Math.random() * arr.length)];
        },
        // 5. DavidCyril Pinterest API
        async () => {
          const r = await axios.get(`https://api.davidcyriltech.my.id/pinterest?query=${q}`, { timeout: 6000 });
          const arr = r.data?.result;
          return arr?.[Math.floor(Math.random() * arr.length)];
        },
        // 6. GuruAPI Pinterest
        async () => {
          const r = await axios.get(`https://api.guruapi.tech/api/pinterest?query=${q}`, { timeout: 6000 });
          const arr = r.data?.result;
          return arr?.[Math.floor(Math.random() * arr.length)];
        },
        // 7. Vyturex Pinterest Search
        async () => {
          const r = await axios.get(`https://api.vyturex.com/pinterest?query=${q}`, { timeout: 6000 });
          const arr = r.data;
          return Array.isArray(arr) ? arr[Math.floor(Math.random() * arr.length)] : null;
        },
        // 8. Unsplash Public Search Endpoint
        async () => {
          const r = await axios.get(`https://api.unsplash.com/photos/random?query=${q}&client_id=b42f317208d0e5b742e680e008427042a92a953974628d447f52a6515b076b36`, { timeout: 6000 });
          return r.data?.urls?.regular;
        },
        // 9. DALL-E/Pollinations High-Res Engine
        async () => {
          return `https://image.pollinations.ai/prompt/${q}?width=1080&height=1080&nologo=true&seed=${Math.floor(Math.random() * 99999)}`;
        },
        // 10. LoremFlickr Direct Category Engine
        async () => {
          return `https://loremflickr.com/1080/1080/${q}`;
        }
      ];

      // Loop through all 10 APIs until one successfully returns an Image Buffer
      for (let i = 0; i < apiList.length; i++) {
        try {
          const imgUrl = await apiList[i]();
          if (imgUrl) {
            imgBuffer = await getBuffer(imgUrl);
            if (imgBuffer) break; // Image එක සාර්ථකව හම්බුණා නම් Loop එක නවත්තනවා
          }
        } catch (err) {
          // API එක Down නම් ඊළඟ API එකට Auto යනවා
          continue;
        }
      }

      if (!imgBuffer) {
        return reply("❌ Image එක ඩවුන්ලෝඩ් කරගැනීමට නොහැකි විය. පස්සේ උත්සාහ කරන්න!");
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
      reply("❌ Image Search කිරීමේදී දෝෂයක් සිදු විය!");
    }
  }
);
