const { cmd, commands } = require("../command");
const yts = require("yt-search");
const { ytmp4 } = require("@vreden/youtube_scraper");

cmd(
  {
    pattern: "video",
    react: "📽️",
    desc: "Download Video",
    category: "download",
    filename: __filename,
  },
  async (
    robin,
    mek,
    m,
    {
      from,
      quoted,
      body,
      isCmd,
      command,
      args,
      q,
      isGroup,
      sender,
      senderNumber,
      botNumber2,
      botNumber,
      pushname,
      isMe,
      isOwner,
      groupMetadata,
      groupName,
      participants,
      groupAdmins,
      isBotAdmins,
      isAdmins,
      reply,
    }
  ) => {
    try {
      // 1. Reaction එක Auto යැවීම
      await robin.sendMessage(from, {
        react: { text: "📽️", key: mek.key }
      });

      if (!q) return reply("*GIVE NAME OR LINK!* 🌚❤️");

      // Search for the video
      const search = await yts(q);
      if (!search || !search.videos.length) return reply("❌ Video not found!");
      const data = search.videos[0];
      const url = data.url;

      // Video metadata description
      let desc = `
*❤️REMEMBER VIDEO DOWNLOADER❤️*

👻 *title* : ${data.title}
👻 *description* : ${data.description}
👻 *time* : ${data.timestamp}
👻 *ago* : ${data.ago}
👻 *views* : ${data.views}
👻 *url* : ${data.url}

𝙼𝙰𝙳𝙴 𝙱𝚈 𝚁𝙴𝙼𝙴𝙼𝙱𝙴𝚁
`;

      // Send metadata thumbnail message
      await robin.sendMessage(
        from,
        { image: { url: data.thumbnail }, caption: desc },
        { quoted: mek }
      );

      // Validate video duration (limit: 30 minutes)
      let durationParts = data.timestamp.split(":").map(Number);
      let totalSeconds =
        durationParts.length === 3
          ? durationParts[0] * 3600 + durationParts[1] * 60 + durationParts[2]
          : durationParts[0] * 60 + durationParts[1];

      if (totalSeconds > 1800) {
        return reply("⏱️ Video limit is 30 minutes");
      }

      // Download the video using @vreden/youtube_scraper
      const quality = "360"; // Video Quality (360p or 720p)
      const videoData = await ytmp4(url, quality);

      if (!videoData || !videoData.download || !videoData.download.url) {
        return reply("❌ Video download link generation failed!");
      }

      // Send video file (Corrected from audio to video)
      await robin.sendMessage(
        from,
        {
          video: { url: videoData.download.url },
          mimetype: "video/mp4",
          caption: `${data.title}\n\n𝙼𝙰𝙳𝙴 𝙱𝚈 𝚁𝙴𝙼𝙴𝙼𝙱𝙴𝚁`
        },
        { quoted: mek }
      );

      // Send as a document (optional)
      await robin.sendMessage(
        from,
        {
          document: { url: videoData.download.url },
          mimetype: "video/mp4",
          fileName: `${data.title}.mp4`,
          caption: "𝙼𝙰𝙳𝙴 𝙱𝚈 𝚁𝙴𝙼𝙴𝙼𝙱𝙴𝚁",
        },
        { quoted: mek }
      );

      // Done reaction
      await robin.sendMessage(from, {
        react: { text: "✅", key: mek.key }
      });

      return reply("*Thanks for using my bot* 🌚❤️");
    } catch (e) {
      console.log(e);
      reply(`❌ Error: ${e.message}`);
    }
  }
);
