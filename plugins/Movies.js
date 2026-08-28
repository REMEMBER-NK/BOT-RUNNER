const { cmd } = require("../command");
const axios = require("axios");

cmd(
  {
    pattern: "movie",
    alias: ["cinesub", "mv", "sinhalasub", "film"],
    react: "🎬",
    desc: "Search & Direct Download Movie to WhatsApp",
    category: "download",
    filename: __filename,
  },
  async (remember, mek, m, { reply, q }) => {
    try {
      if (!q) return reply("📌 *කරුණාකර චිත්‍රපටයේ නම ඇතුළත් කරන්න!*\n\n*උදා:* `.movie Avatar`");

      await reply("🔍 *සිනමාපටය සොයා Video File එක සකසමින් පවතී. සුළු මොහොතක් රැඳී සිටින්න...*");

      // Direct Movie Search API
      const res = await axios.get(`https://api.dreaded.site/api/subscene?search=${encodeURIComponent(q)}`);

      if (!res.data || !res.data.result || res.data.result.length === 0) {
        return reply("❌ *ඔබ සෙවූ චිත්‍රපටයේ Direct Video File එක හමු වූයේ නැත. වෙනත් නමකින් උත්සාහ කරන්න!*");
      }

      const movie = res.data.result[0];

      let movieInfo = `🎬 *${movie.title || q.toUpperCase()}* 🎬\n\n` +
                      `📅 *Category:* ${movie.category || "Movie"}\n` +
                      `📝 *Language:* ${movie.language || "English / Sinhala Sub"}\n\n` +
                      `📥 *Video File එක WhatsApp වෙත Upload වෙමින් පවතී...*`;

      // 1. Poster එක යැවීම
      if (movie.image) {
        await remember.sendMessage(m.chat, { image: { url: movie.image }, caption: movieInfo }, { quoted: mek });
      } else {
        await reply(movieInfo);
      }

      // 2. Direct Video Document එක WhatsApp එකට Upload කිරීම
      const downloadUrl = movie.url || movie.download;
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
      } else {
        reply("⚠️ *Movie details හමු වූවත් Direct Video File එක ලබා ගැනීමට නොහැකි විය.*");
      }

    } catch (e) {
      console.error("Movie Video Download Error:", e);
      reply("❌ *Video File එක Upload කිරීමේදී දෝෂයක් සිදු විය (File Size එක වැඩි වීම හෝ Server Limit එකක් විය හැක).*");
    }
  }
);
