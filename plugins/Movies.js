const { cmd } = require("../command");
const axios = require("axios");

cmd(
  {
    pattern: "movie",
    alias: ["cinesub", "mv", "sinhalasub", "film"],
    react: "🎬",
    desc: "Search & Send Movie Direct File to WhatsApp",
    category: "download",
    filename: __filename,
  },
  async (remember, mek, m, { reply, q }) => {
    try {
      if (!q) return reply("📌 *කරුණාකර චිත්‍රපටයේ නම ඇතුළත් කරන්න!*\n\n*උදා:* `.movie Avatar`");

      await reply("🔍 *සිනමාපටය සොයා Video File එක WhatsApp එකට සකසමින් පවතී. සුළු මොහොතක් රැඳී සිටින්න...*");

      // Movie Scraper API
      const res = await axios.get(`https://api.dreaded.site/api/subscene?search=${encodeURIComponent(q)}`, { timeout: 15000 });

      if (res.data && res.data.result && res.data.result.length > 0) {
        const movie = res.data.result[0];
        const downloadUrl = movie.url || movie.download;

        let movieInfo = `🎬 *${movie.title || q.toUpperCase()}* 🎬\n\n` +
                        `📅 *Category:* ${movie.category || "Movie"}\n` +
                        `📝 *Language:* ${movie.language || "English / Sinhala Sub"}\n\n` +
                        `📥 *Video File එක WhatsApp එකට Upload වෙමින් පවතී...*`;

        // 1. Poster / Details යැවීම
        if (movie.image) {
          await remember.sendMessage(m.chat, { image: { url: movie.image }, caption: movieInfo }, { quoted: mek });
        } else {
          await reply(movieInfo);
        }

        // 2. Direct Video File එක WhatsApp එකට Upload කිරීම (Document එකක් ලෙස)
        if (downloadUrl) {
          await remember.sendMessage(
            m.chat,
            {
              document: { url: downloadUrl },
              mimetype: "video/mp4",
              fileName: `${movie.title || q}.mp4`,
              caption: `🎬 *${movie.title || q}*\n\n📌 *Downloaded via REMEMBER-MD Bot*`
            },
            { quoted: mek }
          );
          return;
        }
      }

      // API එකෙන් Direct Link එක නැත්නම් Pixeldrain / Direct Links යැවීම
      const pixeldrainUrl = `https://pixeldrain.com/api/file/`; // Pixeldrain Direct Stream
      reply(`⚠️ *Direct Video File එක WhatsApp ලිමිට් එකට වඩා වැඩි විය හැක.* \n\n` +
            `🔗 *Direct Speed Download Link:* https://sinhalasub.lk/?s=${encodeURIComponent(q)}`);

    } catch (e) {
      console.error("Movie Download Error:", e);
      reply("❌ *Video File එක Upload කිරීමට නොහැකි විය! File Size එක WhatsApp / Railway Memory Limit එකට වඩා වැඩි විය හැක.*");
    }
  }
);
