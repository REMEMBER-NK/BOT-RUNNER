const { cmd } = require("../command");

// Anti-Delete State (Global Toggle)
global.antiDeleteEnabled = true; // Default ON

cmd(
  {
    pattern: "antidelete",
    alias: ["antidel"],
    react: "🗑️",
    desc: "Turn Anti-Delete feature ON or OFF",
    category: "owner",
    filename: __filename
  },
  async (remember, mek, m, { reply, args, isOwner }) => {
    try {
      if (!isOwner) return reply("❌ මෙම Command එක භාවිත කළ හැක්කේ Bot Owner ට පමණි!");

      const option = args[0]?.toLowerCase();

      if (option === "on") {
        global.antiDeleteEnabled = true;
        return reply("✅ *Anti-Delete Feature සාර්ථකව ON කරන ලදී!*");
      } else if (option === "off") {
        global.antiDeleteEnabled = false;
        return reply("❌ *Anti-Delete Feature OFF කරන ලදී!*");
      } else {
        return reply(`📌 *භාවිතය:* \n.antidelete on - On කිරීමට\n.antidelete off - Off කිරීමට\n\n*දැනට තත්ත්වය:* ${global.antiDeleteEnabled ? "ON 🟢" : "OFF 🔴"}`);
      }

    } catch (e) {
      console.error(e);
      reply("❌ Anti-Delete Toggle කිරීමේදී දෝෂයක් ආවා!");
    }
  }
);
