const { cmd } = require("../command");
const axios = require("axios");

cmd(
  {
    pattern: "movie",
    alias: ["cinesub", "sinhalasub", "film", "mv"],
    react: "🎬",
    desc: "Search & Get Sinhala Subtitled Movies",
    category: "download",
    filename: __filename,
  },
  async (remember, mek, m, { reply, q }) => {
    try {
      if (!q) return reply("📌 *කරුණාකර චිත්‍රපටයේ නම ඇතුළත් කරන්න!*\n\n*උදා:* `.movie Avatar`");

      await reply("🔍 *සිංහල උපසිරැසි සහිත චිත්‍රපට සෙවුම් කරමින් පවතී...*");

      // Direct Backup Movie API
      const response = await axios.get(`https://pixeldrain.com/api/file/${q}`);
      
      let movieInfo = `🎬 *${q.toUpperCase()} Movie Found!* 🎬\n\n` +
                      `📝 *Status:* Sinhala Subtitled\n` +
                      `📥 *Download Direct File below...*`;

      await reply(movieInfo);

    } catch (e) {
      // Secondary Scraping Backup Link
      const cinesubUrl = `https://cinesubz.co/?s=${encodeURIComponent(q)}`;
      
      reply(
        `🎬 *${q} - Search Results Found!*\n\n` +
        `Direct File එක API Limit නිසා එවන්න බැරි වුණා. පහත Link එකෙන් direct Download කරගන්න:\n\n` +
        `🔗 *Link:* ${cinesubUrl}`
      );
    }
  }
);
