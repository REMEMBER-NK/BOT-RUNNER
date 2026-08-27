const { cmd } = require("../command");
const axios = require("axios");

// RELIABLE IMAGE SEARCH (.pin / .img)
cmd(
  {
    pattern: "pinterest",
    alias: ["pin", "pins", "img", "image"],
    react: "📌",
    desc: "Search and download HD images directly",
    category: "download",
    filename: __filename
  },
  async (remember, mek, m, { from, reply, args }) => {
    try {
      const query = args.join(" ");
      if (!query) return reply("❌ කරුණාකර සෙවිය යුතු නම ලබාදෙන්න!\n\nEx: `.pin naruto wallpaper`");

      reply(`⏳ *"${query}" සඳහා Image එකක් සොයමින් පවතී...*`);

      let imageUrl = null;

      // Method 1: Source Unsplash Random API (Direct & Ultra Fast)
      try {
        const res = await axios.get(`https://source.unsplash.com/1600x900/?${encodeURIComponent(query)}`, {
          timeout: 10000,
          maxRedirects: 5
        });
        if (res.request && res.request.res && res.request.res.responseUrl) {
          imageUrl = res.request.res.responseUrl;
        }
      } catch (e) {}

      // Method 2: Fallback Image Search API (If Method 1 gets rate limited)
      if (!imageUrl) {
        try {
          const res2 = await axios.get(`https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&client_id=b42f317208d0e5b742e680e008427042a92a953974628d447f52a6515b076b36`, {
            timeout: 10000
          });
          if (res2.data && res2.data.urls && res2.data.urls.regular) {
            imageUrl = res2.data.urls.regular;
          }
        } catch (e) {}
      }

      if (!imageUrl) {
        return reply("❌ Image එක සොයාගැනීමට නොහැකි විය. වෙනත් නමක් ටයිප් කරන්න!");
      }

      // Send Image
      await remember.sendMessage(
        from,
        {
          image: { url: imageUrl },
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
