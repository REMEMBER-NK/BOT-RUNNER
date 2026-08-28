const { cmd } = require("../command");
const axios = require("axios");

cmd(
  {
    pattern: "movie",
    alias: ["cinesub", "mv", "sinhalasub", "film"],
    react: "🎬",
    desc: "Search Sinhala Sub Movies with Fast Direct Links",
    category: "download",
    filename: __filename,
  },
  async (remember, mek, m, { reply, q }) => {
    try {
      if (!q) return reply("📌 *කරුණාකර චිත්‍රපටයේ නම ඇතුළත් කරන්න!*\n\n*උදා:* `.movie Avatar`");

      await reply("🔍 *සිනමාපටයේ Direct Download Links සකසමින් පවතී...*");

      // Fetch OMDb Info
      const omdbRes = await axios.get(`https://www.omdbapi.com/?t=${encodeURIComponent(q)}&apikey=762a2b93`);
      const movie = omdbRes.data;

      const movieTitle = (movie && movie.Response !== "False") ? movie.Title : q.toUpperCase();
      const poster = (movie && movie.Poster !== "N/A") ? movie.Poster : null;
      const imdb = movie?.imdbRating || "N/A";
      const year = movie?.Year || "N/A";
      const plot = movie?.Plot || "තොරතුරු ලබාගත නොහැක.";

      const cinesubUrl = `https://cinesubz.co/?s=${encodeURIComponent(q)}`;
      const sinhalasubUrl = `https://sinhalasub.lk/?s=${encodeURIComponent(q)}`;

      let caption = `🎬 *MOVIE:* ${movieTitle.toUpperCase()} (${year})\n` +
                    `⭐ *IMDb Rating:* ${imdb}\n\n` +
                    `📝 *Story:* ${plot}\n\n` +
                    `━━━━━━━━━━━━━━━━━━━━\n` +
                    `📥 *DIRECT SINHALA SUB DOWNLOAD LINKS:*\n\n` +
                    `🔗 *Cinesubz:* ${cinesubUrl}\n` +
                    `🔗 *Sinhalasub:* ${sinhalasubUrl}\n` +
                    `━━━━━━━━━━━━━━━━━━━━\n` +
                    `📌 *Link එක උඩ Click කර සෘජුවම Film එක Download කරගන්න!*`;

      if (poster) {
        await remember.sendMessage(m.chat, { image: { url: poster }, caption: caption }, { quoted: mek });
      } else {
        await reply(caption);
      }

    } catch (e) {
      console.error("Movie Error:", e);
      reply("❌ *සෙවීම අසාර්ථක විය. වෙනත් නමකින් උත්සාහ කරන්න!*");
    }
  }
);
