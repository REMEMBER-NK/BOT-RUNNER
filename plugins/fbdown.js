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
    { from, body, args, q, reply }
  ) => {
    try {
      // 1. Message එකට Auto React (☑️) කරන කොටස
      await robin.sendMessage(from, { 
        react: { text: "☑️", key: mek.key } 
      });

      // q එක නැත්නම් body එකෙන් link එක කඩලා ගන්නවා
      let text = q || args.join(" ") || body.slice(3).trim();

      if (!text) return reply("*Please provide a valid Facebook video URL!* 🌚❤️");

      // < > සලකුණු අයින් කර Link එක Clean කරගැනීම
      const cleanUrl = text.replace(/[<>]/g, "").trim();

      const fbRegex = /(facebook\.com|fb\.watch|fb\.gg)/i;
      
      if (!fbRegex.test(cleanUrl))
        return reply("*Invalid Facebook URL! Please check and try again.* 🌚");

      reply("*Downloading your video...* 🌚❤️");

      const result = await getFbVideoInfo(cleanUrl);

      if (!result || (!result.sd && !result.hd)) {
        return reply("*Failed to download video. Please try again later.* 🌚");
      }

      const { title, sd, hd } = result;

      let desc = `
*❤️ REMEMBER MD FB VIDEO DOWNLOADER ❤️*

👻 *Title*: ${title || "Unknown"}
👻 *Quality*: ${hd ? "HD Available" : "SD Only"}

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
