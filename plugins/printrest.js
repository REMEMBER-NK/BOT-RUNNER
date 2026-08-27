const { cmd } = require("../command");
const axios = require("axios");

// Fast Image Downloader Buffer (Max 5MB)
async function getBuffer(url) {
  try {
    const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 8000 });
    const buffer = Buffer.from(res.data, 'binary');
    if (buffer.length > 5 * 1024 * 1024) return null; // Skip images > 5MB
    return buffer;
  } catch (e) {
    return null;
  }
}

cmd(
  {
    pattern: "pin",
    alias: ["pinterest"],
    react: "📌",
    desc: "Search and download Pinterest images",
    category: "download",
    filename: __filename
  },
  async (remember, mek, m, { from, q, reply }) => {
    try {
      if (!q) return reply("❌ කරුණාකර Search කරන්න ඕන නම ලබාදෙන්න! (Ex: `.pin anime`)");

      // ඔයාගේ Pinterest Search API URL එක මෙතනට දාන්න
      const apiUrl = `YOUR_PINTEREST_API_URL_HERE?q=${encodeURIComponent(q)}`;
      const response = await axios.get(apiUrl);

      if (!response.data || !response.data.success || !response.data.results || response.data.results.length === 0) {
        return reply("❌ කිසිදු රූපයක් හමු නොවීය!");
      }

      const results = response.data.results;
      // එන Results 5න් එකක් Random තෝරාගැනීම
      const randomItem = results[Math.floor(Math.random() * results.length)];

      const imgBuffer = await getBuffer(randomItem.image);
      if (!imgBuffer) return reply("❌ රූපය Download කරගැනීමට නොහැකි විය. නැවත උත්සාහ කරන්න!");

      const captionText = `📌 *PINTEREST IMAGE DOWNLOADER*\n\n` +
                          `📝 *Title:* ${randomItem.title || 'Pinterest Image'}\n` +
                          `👤 *User:* ${randomItem.username || 'Unknown'}\n` +
                          `🔗 *Source:* ${randomItem.source}`;

      await remember.sendMessage(
        from, 
        { image: imgBuffer, caption: captionText }, 
        { quoted: mek }
      );

    } catch (err) {
      reply(`❌ Error: ${err.message}`);
    }
  }
);
