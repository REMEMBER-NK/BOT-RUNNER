const { cmd } = require('../command');
const yts = require('yt-search');
const ytdl = require('ytdl-core');

// 1. Youtube Song (Audio) Downloader Command
cmd({
    pattern: "song",
    alias: ["ytmp3", "play"],
    react: "🎧",
    desc: "Download Audio from YouTube",
    category: "download",
    filename: __filename
},
async (conn, mek, m, { from, q, reply }) => {
    try {
        // Reaction එක Auto යවනවා
        await conn.sendMessage(from, { react: { text: "🎧", key: mek.key } });

        if (!q) return reply("*PLEASE GIVE ME A SONG NAME OR SONG LINK!* 🌚");

        // Search Search Result
        const search = await yts(q);
        const data = search.videos[0];

        if (!data) return reply("*NO FOUND ANY SONG!* 🌚");

        const url = data.url;

        let desc = `*❤️ REMEMBER MD SONG DOWNLOADER ❤️*

🎵 *Title:* ${data.title}
⏱️ *Duration:* ${data.timestamp}
👁️ *Views:* ${data.views}
👤 *Channel:* ${data.author.name}
🔗 *URL:* ${data.url}

> *Downloading audio... Please wait!* ⏳`;

        // Details Message
        await conn.sendMessage(from, { image: { url: data.thumbnail }, caption: desc }, { quoted: mek });

        // Audio Send කිරීම
        await conn.sendMessage(from, { 
            audio: { url: `https://api.dreaded.site/api/ytdl/video?url=${url}` }, // Direct Audio Stream API
            mimetype: 'audio/mp4',
            ptt: false 
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.log("Song Download Error:", e);
        reply(`❌ *Error:* ${e.message || e}`);
    }
});

// 2. Youtube Video Downloader Command
cmd({
    pattern: "video",
    alias: ["ytmp4", "ytv"],
    react: "🎬",
    desc: "Download Video from YouTube",
    category: "download",
    filename: __filename
},
async (conn, mek, m, { from, q, reply }) => {
    try {
        // Reaction එක Auto යවනවා
        await conn.sendMessage(from, { react: { text: "🎬", key: mek.key } });

        if (!q) return reply("*PLEASE GIVE ME A VIDEO LINK OR NAME!* 🌚");

        const search = await yts(q);
        const data = search.videos[0];

        if (!data) return reply("*NO FOUND ANY VIDEO!* 🌚");

        const url = data.url;

        let desc = `*❤️ REMEMBER MD VIDEO DOWNLOADER ❤️*

🎬 *Title:* ${data.title}
⏱️ *Duration:* ${data.timestamp}
👁️ *Views:* ${data.views}
👤 *Channel:* ${data.author.name}

> *Downloading video... Please wait!* ⏳`;

        await conn.sendMessage(from, { image: { url: data.thumbnail }, caption: desc }, { quoted: mek });

        // Video Send කිරීම
        await conn.sendMessage(from, { 
            video: { url: `https://api.dreaded.site/api/ytdl/video?url=${url}` }, 
            caption: `*${data.title}*\n\n> REMEMBER MD YOUTUBE DOWNLOADER 🚀`
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.log("Video Download Error:", e);
        reply(`❌ *Error:* ${e.message || e}`);
    }
});
