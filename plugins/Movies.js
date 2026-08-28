const { cmd } = require("../command");
const axios = require("axios");

cmd(
  {
    pattern: "movie",
    alias: ["cinesub", "mv", "sinhalasub"],
    react: "🎬",
    desc: "Search and download movies with Sinhala Subtitles",
    category: "download",
    filename: __filename,
  },
  async (remember, mek, m, { reply, args, q }) => {
    try {
      if (!q) {
        return reply("📌 *කරුණාකර චිත්‍රපටයේ නම ඇතුළත් කරන්න!*\n\n*උදා:* `.movie Avatar`");
      }

      await reply("🔍 *සිංහල උපසිරැසි සහිත චිත්‍රපට සෙවුම් කරමින් පවතී...*");

      // 1. Search Movie
      const searchUrl = `https://api.cinesubz.co/api/v1/search?q=${encodeURIComponent(q)}`;
      const res = await axios.get(searchUrl);

      if (!res.data || !res.data.result || res.data.result.length === 0) {
        return reply("❌ *ඔබ සෙවූ චිත්‍රපටය හමු වූයේ නැත. නම නිවැරදිදැයි නැවත බලන්න!*");
      }

      const movie = res.data.result[0]; // Get First Search Result

      // 2. Send Movie Info & Poster
      let movieInfo = `🎬 *${movie.title}* 🎬\n\n` +
                      `📅 *Released:* ${movie.year || "N/A"}\n` +
                      `⭐ *Rating:* ${movie.rating || "N/A"}\n` +
                      `🎭 *Category:* Sinhala Subtitled Movie\n\n` +
                      `📥 *සිනමාපටය Document එකක් ලෙස ඩවුන්ලෝඩ් වෙමින් පවතී...*`;

      if (movie.image) {
        await remember.sendMessage(m.chat, { image: { url: movie.image }, caption: movieInfo }, { quoted: mek });
      } else {
        await reply(movieInfo);
      }

      // 3. Download Link Handling
      const downloadUrl = movie.downloadLink || movie.dl_url;

      if (downloadUrl) {
        await remember.sendMessage(
          m.chat,
          {
            document: { url: downloadUrl },
            mimetype: "video/mp4",
            fileName: `${movie.title} (Sinhala Sub).mp4`,
            caption: `🎬 *${movie.title}*\n📝 *Sinhala Subtitles Included!*`
          },
          { quoted: mek }
        );
      } else {
        reply("❌ *Direct Download Link එක ලබා ගැනීමට නොහැකි විය!*");
      }

    } catch (e) {
      console.error("Movie Download Error:", e);
      reply("❌ *චිත්‍රපටය ලබා ගැනීමේදී දෝෂයක් සිදු විය! (API / Network Error)*");
    }
  }
);
