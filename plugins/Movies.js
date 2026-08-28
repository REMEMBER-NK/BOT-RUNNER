const { cmd } = require("../command");
const axios = require("axios");

cmd(
  {
    pattern: "movie",
    alias: ["cinesub", "mv", "sinhalasub", "film"],
    react: "🎬",
    desc: "Search & Download Sinhala Subtitled Movies",
    category: "download",
    filename: __filename,
  },
  async (remember, mek, m, { reply, q }) => {
    try {
      if (!q) {
        return reply("📌 *කරුණාකර චිත්‍රපටයේ නම ඇතුළත් කරන්න!*\n\n*උදා:* `.movie Joker`");
      }

      await reply("🔍 *චිත්‍රපටය සොයමින් පවතී, සුළු මොහොතක් රැඳී සිටින්න...*");

      // Direct Backup API for Sinhala Sub & Movies
      const res = await axios.get(`https://api.dreaded.site/api/subscene?search=${encodeURIComponent(q)}`);

      if (!res.data || !res.data.result || res.data.result.length === 0) {
        // Backup Secondary API Search
        const res2 = await axios.get(`https://api.agatz.xyz/api/movie?q=${encodeURIComponent(q)}`);
        
        if (!res2.data || res2.data.status !== 200 || !res2.data.data) {
          return reply("❌ *ඔබ සෙවූ චිත්‍රපටය හමු වූයේ නැත. නම නිවැරදිදැයි බලන්න!*");
        }

        const movieData = res2.data.data[0];
        let info = `🎬 *${movieData.title || q.toUpperCase()}* 🎬\n\n` +
                   `📝 *Description:* ${movieData.description || "N/A"}\n\n` +
                   `📥 *Link:* ${movieData.link}`;

        return reply(info);
      }

      const movie = res.data.result[0];

      let movieInfo = `🎬 *${movie.title || q.toUpperCase()}* 🎬\n\n` +
                      `📅 *Category:* ${movie.category || "Movie"}\n` +
                      `📝 *Language:* ${movie.language || "Sinhala Sub"}\n\n` +
                      `📥 *ඩවුන්ලෝඩ් එක සැකසෙමින් පවතී...*`;

      if (movie.image) {
        await remember.sendMessage(m.chat, { image: { url: movie.image }, caption: movieInfo }, { quoted: mek });
      } else {
        await reply(movieInfo);
      }

      // Download Document / Video File
      if (movie.url || movie.download) {
        await remember.sendMessage(
          m.chat,
          {
            document: { url: movie.url || movie.download },
            mimetype: "video/mp4",
            fileName: `${movie.title || q}.mp4`,
            caption: `🎬 *${movie.title || q}*\n📝 *REMEMBER BOT Movie Downloader*`
          },
          { quoted: mek }
        );
      }

    } catch (e) {
      console.error("Movie Download Error:", e);
      reply("❌ *API Server Error! වෙනත් චිත්‍රපටයක නමක් දී උත්සාහ කරන්න.*");
    }
  }
);
