const { cmd, commands } = require("../command");
const yts = require("yt-search");
const { ytmp3 } = require("@vreden/youtube_scraper");

cmd(
  {
    pattern: "song",
    react: "🎵",
    desc: "Download Song",
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
      // 1. Reaction එක auto යැවීම
      await robin.sendMessage(from, {
        react: { text: "🎵", key: mek.key }
      });

      if (!q) return reply("*GIVE NAME OR LINK!* 🌚❤️");

      // Search for the video
      const search = await yts(q);
      if (!search || !search.videos.length) return reply("❌ Song not found!");
      const data = search.videos[0];
      const url = data.url;

      // Song metadata description
      let desc = `
*❤️REMEMBER SONG DOWNLOADER❤️*

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

      // Validate song duration (limit: 30 minutes)
      let durationParts = data.timestamp.split(":").map(Number);
      let totalSeconds =
        durationParts.length === 3
          ? durationParts[0] * 3600 + durationParts[1] * 60 + durationParts[2]
          : durationParts[0] * 60 + durationParts[1];

      if (totalSeconds > 1800) {
        return reply("⏱️ audio limit is 30 minutes");
      }

      // Download the audio using @vreden/youtube_scraper
      const quality = "128";
      const songData = await ytmp3(url, quality);

      if (!songData || !songData.download || !songData.download.url) {
        return reply("❌ Download link generation failed!");
      }

      // Send audio file
      await robin.sendMessage(
        from,
        {
          audio: { url: songData.download.url },
          mimetype: "audio/mpeg",
        },
        { quoted: mek }
      );

      // Send as a document
      await robin.sendMessage(
        from,
        {
          document: { url: songData.download.url },
          mimetype: "audio/mpeg",
          fileName: `${data.title}.mp3`,
          caption: "𝙼𝙰𝙳𝙴 𝙱𝚈 𝚁𝙴𝙼𝙴𝙼𝙱𝙴𝚁",
        },
        { quoted: mek }
      );

      // Done reaction (optional)
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
