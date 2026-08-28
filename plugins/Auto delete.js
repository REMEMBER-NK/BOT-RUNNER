const { cmd } = require("../command");

// TAHANAM WACHANA LIST
const BAD_WORDS = [
  "puka", "paka", "htt", "hukana", "huththa", "kari", "ponnaya", "hukapan", "hukano", "pakaya", "ponna", "hutho", "huththo"
];

const userWarnings = new Map();

cmd(
  {
    on: "body",
    desc: "Auto delete bad words & warning system",
    category: "group",
    filename: __filename,
  },
  async (remember, mek, m, { isGroup, sender }) => {
    try {
      if (!isGroup) return;

      let text = m.text || m.body || m.message?.conversation || m.message?.extendedTextMessage?.text || "";
      text = text.toLowerCase();

      const hasBadWord = BAD_WORDS.some((word) => text.includes(word));

      if (hasBadWord) {
        const from = m.chat;

        // 1. Delete Message
        try {
          await remember.sendMessage(from, { delete: m.key });
        } catch (e) {
          console.log("Delete error:", e);
        }

        // 2. Count Warnings
        let currentWarns = (userWarnings.get(sender) || 0) + 1;
        userWarnings.set(sender, currentWarns);

        const username = `@${sender.split("@")[0]}`;

        if (currentWarns === 1) {
          await remember.sendMessage(from, {
            text: `⚠️ *[ 1ST WARNING ]*\n━━━━━━━━━━━━━━━━━━━━\n👤 *User:* ${username}\n🚫 *Reason:* කුණුහරප භාවිතය\n📌 *Status:* Message Deleted!\n\n💬 *සමූහය තුළ අසැබි වචන භාවිතය තහනම්!*`,
            mentions: [sender],
          });
        } else if (currentWarns === 2) {
          await remember.sendMessage(from, {
            text: `🚨 *[ 2ND WARNING - FINAL ALERT ]*\n━━━━━━━━━━━━━━━━━━━━\n👤 *User:* ${username}\n⚠️ *තව එක් වරක් වැරදි කළහොත් Auto Kick කරනු ලැබේ!*`,
            mentions: [sender],
          });
        } else if (currentWarns >= 3) {
          await remember.sendMessage(from, {
            text: `🛑 *[ FINAL WARNING - KICKED ]*\n━━━━━━━━━━━━━━━━━━━━\n👤 *User:* ${username}\n✈️ *වාර 3ක්ම නීති කඩ කළ නිසා Group එකෙන් ඉවත් කරන ලදී!*`,
            mentions: [sender],
          });
          await remember.groupParticipantsUpdate(from, [sender], "remove");
          userWarnings.delete(sender);
        }
      }
    } catch (e) {
      console.error("AntiBad Error:", e);
    }
  }
);
