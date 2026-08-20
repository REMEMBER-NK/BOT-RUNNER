const { cmd, commands } = require("../command");
const getFbVideoInfo = require("@renpwn/fb-downloader");

cmd(
  {
    pattern: "fb",
    alias: ["facebook"],
    react: "☑️",
    desc: "Download Facebook Video",
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
      if (!q) return reply("*Please provide a valid Facebook video URL!* 🌚❤️");

      // 1. Link එක දෙපැත්තේ තියෙන < > සලකුණු සහ extra spaces අයින් කිරීම
      const cleanUrl = q.replace(/[<>]/g, "").trim();

      // 2. Facebook, Reels, Watch, Mobile (m.fb) ඕනම එකක් අල්ලන Regex එක
      const fbRegex = /(facebook\.com|fb\.watch|fb\.gg)/i;
      
      if (!fbRegex.test(cleanUrl))
        return reply("*Invalid Facebook URL! Please check and try again.* 🌚");

      // Fetch video details
      reply("*Downloading your video...* 🌚❤️");

      const result = await getFbVideoInfo(cleanUrl);

      if (!result || (!result.sd && !result.hd)) {
        return reply("*Failed to download video. Please try again later.* 🌚");
      }

      const { title, sd, hd } = result;

      // Prepare and send the message with video details
      let desc = `
*❤️ REMEMBER MD FB VIDEO DOWNLOADER ❤️*

👻 *Title*: ${title || "Unknown"}
👻 *Quality*: ${hd ? "HD Available" : "SD Only"}

𝐌𝐚𝐝𝐞 𝐛𝐲 𝐒_𝐈_𝐇_𝐈_𝐋_𝐄_𝐋
        `;
      await robin.sendMessage(
        from,
        {
          image: {
            url: "https://raw.githubusercontent.com/REMEMBER-NK/Bot-helpur/refs/heads/main/31322071b2dd4757a80b264729c42ee7.png",
          },
          caption: desc,
        },
        { quoted: mek }
      );

      // Send the video if available
      if (hd) {
        await robin.sendMessage(
          from,
          { video: { url: hd }, caption: "----------HD VIDEO----------" },
          { quoted: mek }
        );
      } else if (sd) {
        await robin.sendMessage(
          from,
          { video: { url: sd }, caption: "----------SD VIDEO----------" },
          { quoted: mek }
        );
      } else {
        return reply("*No downloadable video found!* 🌚");
      }

      return reply("*THANKS FOR USING REMEMBER MD* 🌚❤️");
    } catch (e) {
      console.error(e);
      reply(`*Error:* ${e.message || e}`);
    }
  }
);
