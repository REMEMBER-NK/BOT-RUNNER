const { cmd } = require("../command");
const axios = require("axios");

// PINTEREST DOWNLOADER (.pinterest / .pin)
cmd(
  {
    pattern: "pinterest",
    alias: ["pin", "pindl"],
    react: "📌",
    desc: "Download Pinterest Image or Video",
    category: "download",
    filename: __filename
  },
  async (remember, mek, m, { from, reply, args }) => {
    try {
      let q = args.join(" ");
      if (!q) return reply("❌ කරුණාකර Pinterest Link එකක් ලබාදෙන්න!\n\nEx: `.pin https://pin.it/xxx` හෝ `.pin https://www.pinterest.com/pin/xxx`");

      // Extract URL using Regex (Link එක විතරක් වෙන් කරගැනීමට)
      const urlMatch = q.match(/https?:\/\/[^\s]+/);
      if (!urlMatch) return reply("❌ නිවැරදි Link එකක් ඇතුළත් කරන්න!");
      let cleanUrl = urlMatch[0];

      // Redirect Links (pin.it) Direct Link එකට හරවා ගැනීම
      if (cleanUrl.includes("pin.it")) {
        try {
          const redirectRes = await axios.get(cleanUrl, { maxRedirects: 5 });
          cleanUrl = redirectRes.request.res.responseUrl || cleanUrl;
        } catch (err) {
          // If axios redirect fails, proceed with original link
        }
      }

      if (!cleanUrl.includes("pinterest.com")) {
        return reply("❌ මෙය වලංගු Pinterest Link එකක් නොවේ!");
      }

      reply("⏳ *Pinterest Media එක Download වෙමින් පවතී...*");

      // Multi-API Fallback (1st API)
      let mediaUrl = null;
      let isVideo = false;

      try {
        const api1 = await axios.get(`https://api.guruapi.tech/api/pinterest?url=${encodeURIComponent(cleanUrl)}`, { timeout: 12000 });
        if (api1.data && api1.data.result) {
          mediaUrl = api1.data.result.url || api1.data.result;
          isVideo = api1.data.result.type === 'video' || (typeof mediaUrl === 'string' && mediaUrl.includes('.mp4'));
        }
      } catch (e) {}

      // Backup API (2nd API if 1st fails)
      if (!mediaUrl) {
        try {
          const api2 = await axios.get(`https://api.vyturex.com/pinterest?url=${encodeURIComponent(cleanUrl)}`, { timeout: 12000 });
          if (api2.data && api2.data.url) {
            mediaUrl = api2.data.url;
            isVideo = mediaUrl.includes('.mp4');
          }
        } catch (e) {}
      }

      if (!mediaUrl) return reply("❌ Media එක සොයාගැනීමට නොහැකි විය. Server එක හිරවී ඇත!");

      // Send Video or Image
      if (isVideo) {
        await remember.sendMessage(
          from,
          { video: { url: mediaUrl }, caption: "📌 *Pinterest Video*", mimetype: "video/mp4" },
          { quoted: mek }
        );
      } else {
        await remember.sendMessage(
          from,
          { image: { url: mediaUrl }, caption: "📌 *Pinterest Image*" },
          { quoted: mek }
        );
      }

    } catch (e) {
      console.error(e);
      reply(`❌ Error: Invalid URL or Server Issue!`);
    }
  }
);
