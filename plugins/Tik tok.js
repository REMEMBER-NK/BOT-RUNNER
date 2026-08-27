const { cmd } = require("../command");
const axios = require("axios");

// TIKTOK DOWNLOADER (.tiktok / .tt)
cmd(
  {
    pattern: "tiktok",
    alias: ["tt", "ttdown"],
    react: "🎵",
    desc: "Download TikTok Video Without Watermark",
    category: "download",
    filename: __filename
  },
  async (remember, mek, m, { from, reply, args }) => {
    try {
      const q = args.join(" ");
      if (!q) return reply("❌ කරුණාකර TikTok Video Link එකක් ලබාදෙන්න!\n\nEx: `.tiktok https://vm.tiktok.com/xxx`");

      if (!q.includes("tiktok.com")) return reply("❌ වැරදි Link එකක්! TikTok Link එකක්ම ලබාදෙන්න.");

      reply("⏳ *TikTok Video එක Download වෙමින් පවතී...*");

      // Tikwm API (Free & No Key Needed)
      const apiUrl = `https://www.tikwm.com/api/?url=${encodeURIComponent(q)}`;
      const res = await axios.get(apiUrl, { timeout: 15000 });

      if (!res.data || res.data.code !== 0) {
        return reply("❌ Video එක සොයාගැනීමට නොහැකි විය. Link එක පරීක්ෂා කරන්න!");
      }

      const data = res.data.data;
      const videoUrl = data.play; // Watermark නැති HD Video එක
      const caption = `🎵 *TikTok Video Downloader*\n\n` +
                      `👤 *Author:* ${data.author.nickname || 'N/A'}\n` +
                      `📝 *Title:* ${data.title || 'TikTok Video'}\n` +
                      `❤️ *Likes:* ${data.digg_count || 0} | 💬 *Comments:* ${data.comment_count || 0}`;

      // Video එක Direct Send කිරීම
      await remember.sendMessage(
        from,
        {
          video: { url: videoUrl },
          caption: caption,
          mimetype: "video/mp4"
        },
        { quoted: mek }
      );

    } catch (e) {
      console.error(e);
      reply("❌ Video එක Download කිරීමේදී දෝෂයක් සිදු විය!");
    }
  }
);
