const { cmd } = require("../command");
const axios = require("axios");

// 1. TAHANAM WACHANA (BAD WORDS LIST)
const BAD_WORDS = [
  "puka", "paka", "htt", "hukana", "huththa", "kari", "ponnaya", "hukapan", "hukano", "pakaya", "ponna", "hutho", "huththo"
  // තව වචන ඕන නම් මෙතනට එකතු කරගනින්
];

// User Warnings Tracker (In-Memory)
const userWarnings = new Map();

// MESSAGE MONITORING EVENT
remember.ev.on('messages.upsert', async (chatUpdate) => {
  try {
    const mek = chatUpdate.messages[0];
    if (!mek || !mek.message || mek.key.fromMe) return;

    const from = mek.key.remoteJid;
    const isGroup = from.endsWith('@g.us');
    if (!isGroup) return; // Group වලට විතරයි

    const sender = mek.key.participant || mek.key.remoteJid;
    const messageType = Object.keys(mek.message)[0];

    let isViolated = false;
    let violationReason = "";

    // --- A. BAD WORDS FILTER (TEXT) ---
    let text = mek.message.conversation || mek.message.extendedTextMessage?.text || mek.message.imageMessage?.caption || "";
    text = text.toLowerCase();

    const hasBadWord = BAD_WORDS.some(word => text.includes(word));
    if (hasBadWord) {
      isViolated = true;
      violationReason = "කුණුහරප / අසැබි වචන භාවිතය";
    }

    // --- B. 18+ ADULT / NSFW IMAGE FILTER ---
    if (!isViolated && messageType === 'imageMessage') {
      try {
        const stream = await downloadContentFromMessage(mek.message.imageMessage, 'image');
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
          buffer = Buffer.concat([buffer, chunk]);
        }

        // DeepAI / Sightengine API Check
        const formData = new FormData();
        formData.append('media', buffer, { filename: 'image.jpg' });
        formData.append('models', 'nudity-2.0');
        formData.append('api_user', 'YOUR_SIGHTENGINE_API_USER');
        formData.append('api_secret', 'YOUR_SIGHTENGINE_API_SECRET');

        const res = await axios.post('https://api.sightengine.com/1.0/check.json', formData, {
          headers: formData.getHeaders()
        });

        if (res.data && res.data.nudity && res.data.nudity.sexual_activity > 0.5) {
          isViolated = true;
          violationReason = "18+ අසැබි පින්තූර යොමු කිරීම";
        }
      } catch (e) {}
    }

    // --- VIOLATION HANDLING & WARNING SYSTEM ---
    if (isViolated) {
      // 1. Instantly Delete the Violating Message
      await remember.sendMessage(from, { delete: mek.key });

      // 2. Count Warnings
      let currentWarns = (userWarnings.get(sender) || 0) + 1;
      userWarnings.set(sender, currentWarns);

      const username = `@${sender.split('@')[0]}`;

      // --- WARNING MESSAGES STYLES ---
      if (currentWarns === 1) {
        // 1st WARNING
        const warn1Text = 
`⚠️ *[ 1ST WARNING ]* ⚠️
━━━━━━━━━━━━━━━━━━━━
👤 *User:* ${username}
🚫 *Reason:* ${violationReason}
📌 *Status:* Message Deleted!

💬 *සමූහය තුළ කුණුහරප හෝ අසැබි දේ භාවිතය තහනම්!*
⚠️ *තව වාර 2ක් වැරදි කළහොත් සමූහයෙන් ඉවත් කරනු ලැබේ!*
━━━━━━━━━━━━━━━━━━━━`;

        await remember.sendMessage(from, { text: warn1Text, mentions: [sender] });

      } else if (currentWarns === 2) {
        // 2nd WARNING
        const warn2Text = 
`🚨 *[ 2ND WARNING - FINAL ALERT ]* 🚨
━━━━━━━━━━━━━━━━━━━━
👤 *User:* ${username}
🚫 *Reason:* ${violationReason}
📌 *Status:* Message Deleted!

⚠️ *ඔබට හිමි අවසාන අවස්ථාව මෙයයි!*
❌ *තව එක් වරක් වැරදි කළහොත් කිසිදු දැනුම්දීමකින් තොරව Auto Kick කරනු ලැබේ!*
━━━━━━━━━━━━━━━━━━━━`;

        await remember.sendMessage(from, { text: warn2Text, mentions: [sender] });

      } else if (currentWarns >= 3) {
        // FINAL KICK
        const kickText = 
`🛑 *[ FINAL WARNING - KICKED ]* 🛑
━━━━━━━━━━━━━━━━━━━━
👤 *User:* ${username}
🚫 *Reason:* වාර 3ක්ම Group නීති පද්ධතිය උල්ලංඝනය කිරීම!

✈️ *සමූහයේ ආරක්ෂාව උදෙසා අදාළ සාමාජිකයාව Group එකෙන් ඉවත් කරන ලදී!*
━━━━━━━━━━━━━━━━━━━━`;

        // Kick User from Group
        await remember.groupParticipantsUpdate(from, [sender], "remove");
        await remember.sendMessage(from, { text: kickText, mentions: [sender] });
        
        // Reset Warnings
        userWarnings.delete(sender);
      }
    }

  } catch (e) {
    console.error("Filter Error:", e);
  }
});
