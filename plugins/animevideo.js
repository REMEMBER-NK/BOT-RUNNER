const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const cmd = require('../command');

// ⚙️ 1. Telegram API Credentials
const apiId = 21859105; 
const apiHash = "a994154a58476ca576b5d719a5ccd72e"; 

// ⚙️ 2. BotFather Bot Token
const botToken = "8975770176:AAEvau9lKLXyOlOIHiVFQsF-dQQOfasctNA"; 

// ⚙️ 3. Telegram Channel Username
const TG_CHANNEL = "botvideosremember"; 

let tgClient = null;

cmd({
    pattern: "animevideo",
    alias: ["animev", "getav", "v"],
    desc: "Get a random video from Telegram Channel",
    category: "download",
    filename: __filename
},
async(rememberBot, mek, m, { from, reply }) => {
    try {
        await reply("⏳ *Telegram Database එකෙන් Video එකක් ගනිමින් පවතී...*");

        // Telegram Client එක Bot Token එකෙන් Connect කිරීම
        if (!tgClient) {
            console.log("Connecting to Telegram via Bot Token...");
            tgClient = new TelegramClient(new StringSession(""), apiId, apiHash, {
                connectionRetries: 5,
            });

            // Bot Login
            await tgClient.start({
                botAuthToken: botToken,
            });
            console.log("✅ Telegram Bot Client Connected Successfully!");
        }

        // Channel එකේ තියෙන අන්තිම Messages 100 ලබාගැනීම
        const messages = await tgClient.getMessages(TG_CHANNEL, { limit: 100 });

        // Photos/Videos විතරක් Filter කරගැනීම
        const mediaMessages = messages.filter(msg => msg.media);

        if (mediaMessages.length === 0) {
            return reply("❌ Channel එකේ Videos/Photos කිසිවක් හමු නොවුණි!");
        }

        // Random එකක් තෝරාගැනීම
        const randomMsg = mediaMessages[Math.floor(Math.random() * mediaMessages.length)];

        console.log("Downloading media from Telegram...");
        const buffer = await tgClient.downloadMedia(randomMsg.media, {});
        const captionText = randomMsg.message || "Random Content";

        // Photo ද Video ද යන්න බලලා WhatsApp එකට Send කිරීම
        if (randomMsg.media.className === 'MessageMediaPhoto') {
            await rememberBot.sendMessage(from, {
                image: buffer,
                caption: `📸 *Random Anime Image*\n\n📝 ${captionText}\n\n> Powered by REMEMBER-MD`
            }, { quoted: mek });
        } else {
            await rememberBot.sendMessage(from, {
                video: buffer,
                mimetype: 'video/mp4',
                caption: `🎬 *Random Anime Video*\n\n📝 ${captionText}\n\n> Powered by REMEMBER-MD`
            }, { quoted: mek });
        }

    } catch (e) {
        console.error("Telegram Error Detailed:", e);
        reply(`❌ Error එකක් ආවා: ${e.message}`);
    }
});
