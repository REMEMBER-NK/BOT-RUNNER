const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const cmd = require('../command');

// ⚙️ ඔයාගේ Telegram API Details
const apiId = 21859105; 
const apiHash = "a994154a58476ca576b5d719a5ccd72e"; 
const stringSession = new StringSession(""); 

// ⚙️ Telegram Channel Username
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
        reply("⏳ *Database එකෙන් Video එකක් ගනිමින් පවතී...*");

        // Telegram Client එක Connect කිරීම
        if (!tgClient) {
            tgClient = new TelegramClient(stringSession, apiId, apiHash, {
                connectionRetries: 5,
            });
            await tgClient.connect();
        }

        // Channel එකේ තියෙන අන්තිම Messages 80 ලබාගැනීම
        const messages = await tgClient.getMessages(TG_CHANNEL, { limit: 80 });

        // Messages වලින් Media/Video තියෙන ඒවා විතරක් Filter කරගැනීම
        const videoMessages = messages.filter(msg => 
            msg.media && (msg.media.className === 'MessageMediaDocument' || msg.media.className === 'MessageMediaPhoto')
        );

        if (videoMessages.length === 0) {
            return reply("❌ Channel එකේ Videos/Media කිසිවක් හමු නොවුණි!");
        }

        // Random ලෙස එක Video එකක් තෝරාගැනීම
        const randomMsg = videoMessages[Math.floor(Math.random() * videoMessages.length)];

        // Video එක Download කිරීම
        const buffer = await tgClient.downloadMedia(randomMsg.media, {});
        const captionText = randomMsg.message || "Random Video";

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
        console.log("Telegram Random Video Error:", e);
        reply("❌ Video එක ලබාගැනීමේදී දෝෂයක් ආවා!");
    }
});
