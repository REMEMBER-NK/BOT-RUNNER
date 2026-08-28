const { cmd } = require("../command");
const axios = require("axios");

cmd(
  {
    pattern: "movie",
    alias: ["cinesub", "mv", "sinhalasub"],
    react: "🎬",
    desc: "Search movies with Sinhala Subtitles",
    category: "download",
    filename: __filename,
  },
  async (remember, mek, m, { reply, q }) => {
    try {
      if (!q) return reply("📌 *කරුණාකර චිත්‍රපටයේ නම ඇතුළත් කරන්න!*\n\n*උදා:* `.movie Avatar`");

      await reply("🔍 *සිංහල උපසිරැසි සහිත චිත්‍රපට සෙවුම් කරමින් පවතී...*");

      // Working Sinhala Sub Movie API Endpoint
      const res = await axios.get(`https://api.vytx.tech/api/cinesubz?q=${encodeURIComponent(q)}`);

      if (!res.data || !res.data.result || res.data.result.length === 0) {
        return reply("❌ *ඔබ සෙවූ චිත්‍රපටය හමු වූයේ නැත. නම නිවැරදිදැයි නැවත බලන්න!*");
      }

      const movie = res.data.result[0];

      let movieInfo = `🎬 *${movie.title || q}* 🎬\n\n` +
                      `📅 *Year:* ${movie.year || "N/A"}\n` +
                      `⭐ *Rating:* ${movie.rating || "N/A"}\n` +
                      `🎭 *Quality:* ${movie.quality || "720p / 1080p"}\n\n` +
                      `📥 *Download Link:* ${movie.downloadLink || movie.url}`;

      if (movie.image) {
        await remember.sendMessage(m.chat, { image: { url: movie.image }, caption: movieInfo }, { quoted: mek });
      } else {
        await reply(movieInfo);
      }

    } catch (e) {
      console.error("Movie Error:", e);
      reply("❌ *චිත්‍රපටය ලබා ගැනීමේදී දෝෂයක් සිදු විය! ඊළඟ Update එකෙන් Server එක Fix කරන්නම්.*");
    }
  }
);
