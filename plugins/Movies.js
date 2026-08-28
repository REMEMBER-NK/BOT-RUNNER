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

      await reply("🔍 *සිනමාපටය Sinhalasub වෙතින් සොයමින් පවතී...*");

      const searchUrl = `https://sinhalasub.lk/?s=${encodeURIComponent(q)}`;
      const res = await axios.get(searchUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
      });

      const $ = cheerio.load(res.data);
      const firstResult = $("div.result-item, article").first();

      const title = firstResult.find(".title a, .details .title a").text().trim();
      const movieLink = firstResult.find(".title a, .details .title a").attr("href");
      const imgUrl = firstResult.find(".image img, .thumbnail img").attr("src");

      if (!movieLink || !title) {
        // Direct Backup URL Response
        let backupInfo = `🎬 *${q.toUpperCase()} Search Results* 🎬\n\n` +
                         `📌 Direct Search Link: https://sinhalasub.lk/?s=${encodeURIComponent(q)}\n` +
                         `🔗 Cinesubz Link: https://cinesubz.co/?s=${encodeURIComponent(q)}`;
        
        return reply(backupInfo);
      }

      let movieInfo = `🎬 *${title}* 🎬\n\n` +
                      `📝 *Status:* Sinhala Subtitled Movie Found!\n` +
                      `🔗 *Direct Link:* ${movieLink}\n\n` +
                      `📌 *ඉහත Link එකෙන් ගොස් එක ක්ලික් එකෙන් Movie එක Download කරගන්න!*`;

      if (imgUrl) {
        await remember.sendMessage(m.chat, { image: { url: imgUrl }, caption: movieInfo }, { quoted: mek });
      } else {
        await reply(movieInfo);
      }

    } catch (e) {
      console.error("Movie Scraping Error:", e);
      reply(`🎬 *${q.toUpperCase()} Search Link*\n\n` +
            `🔗 Sinhalasub: https://sinhalasub.lk/?s=${encodeURIComponent(q)}\n` +
            `🔗 Cinesubz: https://cinesubz.co/?s=${encodeURIComponent(q)}`);
    }
  }
);
