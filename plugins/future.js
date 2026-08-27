const { cmd } = require("../command");

// FUTURE TELLER / MAGIC 8-BALL (.anagatha / .8ball)
cmd(
  {
    pattern: "anagatha",
    alias: ["8ball", "predict", "future"],
    react: "🔮",
    desc: "Predict the future / Answer yes or no questions",
    category: "fun",
    filename: __filename
  },
  async (remember, mek, m, { reply, args }) => {
    try {
      const question = args.join(" ");
      if (!question) {
        return reply("🔮 *අනාගතේ දැනගන්න ඕන ප්‍රශ්නය අහන්න!*\n\nEx: `.anagatha මට ළඟදීම කෙල්ලෙක් ලැබෙයිද?`");
      }

      // Fun Answers List
      const answers = [
        // Positive
        "✨ ඔව්, අනිවාර්යයෙන්ම ඒක සිද්ධ වෙනවා!",
        "✨ සැකයක් නෑ, ඒක 100%ක්ම වෙනවා.",
        "✨ මට පේන විදිහට නම් උත්තරේ 'ඔව්'!",
        "✨ සුබ ආරංචියක්! ඒක වෙන්න ලොකු ඉඩක් තියෙනවා.",
        "✨ තරු කියන්නේ ඒක අනිවාර්යයෙන්ම වෙනවා කියලා!",
        
        // Neutral / Confused
        "🤔 හ්ම්... තාම කියන්න බෑ, ඊළඟ පාර ආයේ අහන්න.",
        "🤔 ඒ ගැන දැන්ම කියන්න බෑ, වෙලාව ආවාම බලමු.",
        "🤔 හිත එකඟ කරගෙන ආයෙත් එක පාරක් අහන්න බලන්න.",
        
        // Negative / Funny
        "❌ නැත! කවදාවත් වෙන්නේ නෑ මචං.",
        "❌ හිනයක්වත් දකින්න එපා, ඒක වෙන්නේ නෑ!",
        "❌ මට නම් පේන්නේ ඒක වෙන්නේ නෑ වගේ.",
        "❌ ඒක ගැන හිතන එක අතඇරපං!",
        "😂 බොරුවට අහන්න එපා බං, උඹටත් හිතින් උත්තරේ තේරෙනවනේ!"
      ];

      // Pick a random answer
      const randomAnswer = answers[Math.floor(Math.random() * answers.length)];

      const text = `🔮 *අනාගත අනාවැකිය* 🔮\n\n` +
                   `❓ *ප්‍රශ්නය:* ${question}\n` +
                   `💬 *උත්තරය:* ${randomAnswer}`;

      await reply(text);

    } catch (e) {
      console.error(e);
      reply("❌ අනාවැකිය බලද්දී මොකක්දෝ අවුලක් ගියා!");
    }
  }
);
