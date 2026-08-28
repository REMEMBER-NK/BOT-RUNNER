const { cmd } = require("../command");
const axios = require("axios");
const cheerio = require("cheerio");

cmd(
  {
    pattern: "movie",
    alias: ["cinesub", "mv", "sinhalasub", "film"],
    react: "🎬",
    desc: "Search Sinhala Subtitled Movies",
    category: "download",
    filename: __filename,
  },
  async (remember, mek, m, { reply, q }) => {
    try {
      if (!q) return reply("📌 *කරුණාකර චිත්‍රපටයේ නම ඇතුළත් කරන්න!*\n\n*උදා:* `.movie Joker`");

      await reply("🔍 *සිනමාපටය Cinesubz වෙතින් සොයමින් පවතී...*");

      const searchUrl = `https://cinesubz.co/?s=${encodeURIComponent(q)}`;
      const res = await axios.get(searchUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
      });

      const $ = cheerio.load(res.data);
      const firstResult = $("article.item-m").first();

      const title = firstResult.find(".title a").text().trim();
      const movieLink = firstResult.find(".title a").attr("href");
      const imgUrl = firstResult.find(".post-thumbnail img").attr("src");

      if (!movieLink || !title) {
        return reply("❌ *ඔබ සෙවූ චිත්‍රපටය Cinesubz හි හමු වූයේ නැත. නම නිවැරදිදැයි බලන්න!*");
      }

      let movieInfo = `🎬 *${title}* 🎬\n\n` +
                      `📝 *Status:* Sinhala Subtitled\n` +
                      `🔗 *Direct Movie Page:* ${movieLink}\n\n` +
                      `📌 *ඉහත Link එකෙන් ගොස් එක ක්ලික් එකෙන් Film එක Download කරගන්න!*`;

      if (imgUrl) {
        await remember.sendMessage(m.chat, { image: { url: imgUrl }, caption: movieInfo }, { quoted: mek });
      } else {
        await reply(movieInfo);
      }

    } catch (e) {
      console.error("Movie Scraping Error:", e);
      reply(`🎬 *${q.toUpperCase()} Search Results*\n\n` +
            `Direct Scraper එකට Connection Issue එකක් ආවා. පහත Link එකෙන් Direct බලන්න:\n` +
            `🔗 https://cinesubz.co/?s=${encodeURIComponent(q)}`);
    }
  }
);
