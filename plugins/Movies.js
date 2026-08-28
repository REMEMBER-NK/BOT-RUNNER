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

      await reply("🔍 *සිංහල උපසිරැසි සහිත චිත්‍රපට සෙවුම් කරමින් පවතී...*");

      // Working Sinhala Sub Movie API
      const res = await axios.get(`https://api.vytx.tech/api/cinesubz?q=${encodeURIComponent(q)}`);

      if (!res.data || !res.data.status || !res.data.result || res.data.result.length === 0) {
        return reply("❌ *ඔබ සෙවූ චිත්‍රපටය හමු වූයේ නැත. නම නිවැරදිදැයි නැවත බලන්න!*");
      }

      const movie = res.data.result[0];

      // Send Info Caption
      let movieInfo = `🎬 *${movie.title}* 🎬\n\n` +
                      `📅 *Released:* ${movie.year || "N/A"}\n` +
                      `⭐ *Rating:* ${movie.rating || "N/A"}\n` +
                      `🎭 *Quality:* ${movie.quality || "720p / 1080p"}\n\n` +
                      `📥 *සිනමාපටය Document එකක් ලෙස ඩවුන්ලෝඩ් වෙමින් පවතී, සුළු මොහොතක් රැඳී සිටින්න...*`;

      if (movie.image) {
        await remember.sendMessage(m.chat, { image: { url: movie.image }, caption: movieInfo }, { quoted: mek });
      } else {
        await reply(movieInfo);
      }

      // Download Movie File Direct to WhatsApp
      const downloadUrl = movie.dl_link || movie.downloadLink;

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
        reply(`🎬 *${movie.title}* හමු වූ අතර Direct Link එක ලබා ගැනීමට නොහැකි විය.\n🔗 *Link:* ${movie.url}`);
      }

    } catch (e) {
      console.error("Movie Download Error:", e);
      reply("❌ *චිත්‍රපටය සොයා ගැනීමට නොහැකි විය. වෙනත් නමකින් උත්සාහ කරන්න!*");
    }
  }
);
