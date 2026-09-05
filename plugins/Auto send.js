const axios = require('axios');

module.exports = (rememberBot) => {
    rememberBot.ev.on('group-participants.update', async (update) => {
        try {
            const { id, participants, action } = update;

            // අලුතෙන් Member කෙනෙක් එකතු වුණාම විතරක් වැඩ කරයි
            if (action === 'add') {
                for (let num of participants) {
                    const userJid = num;
                    const userName = `@${userJid.split('@')[0]}`;

                    // Group Info සහ Name අරගැනීම
                    const groupMetadata = await rememberBot.groupMetadata(id);
                    const groupName = groupMetadata.subject;
                    const memberCount = groupMetadata.participants.length;

                    // User ගේ Profile Picture එක ගන්න එක
                    let ppUser;
                    try {
                        ppUser = await rememberBot.profilePictureUrl(userJid, 'image');
                    } catch {
                        ppUser = 'https://i.ibb.co/6BRM12f/avatar-contact.png'; // Profile pic නැත්නම් default එකක්
                    }

                    // Welcome Image API URL (Popcat Engine)
                    const welcomeImgUrl = `https://api.popcat.xyz/welcomecard?background=https://i.ibb.co/4M34dqb/wallpaper.jpg&text1=${encodeURIComponent(userName.replace('@',''))}&text2=Welcome+To+${encodeURIComponent(groupName)}&text3=Member+${memberCount}&avatar=${encodeURIComponent(ppUser)}`;

                    // Image එක Fetch කරගැනීම
                    const response = await axios.get(welcomeImgUrl, { responseType: 'arraybuffer', timeout: 15000 });
                    const imageBuffer = Buffer.from(response.data, 'binary');

                    const welcomeText = `👋 *WELCOME TO THE GROUP!* 👋\n\n` +
                                        `👤 *User:* ${userName}\n` +
                                        `🏰 *Group:* ${groupName}\n` +
                                        `🔢 *Member Count:* #${memberCount}\n\n` +
                                        `> *Enjoy your stay & follow the rules!* ❤️`;

                    // Message එක Send කිරීම
                    await rememberBot.sendMessage(id, {
                        image: imageBuffer,
                        caption: welcomeText,
                        mentions: [userJid]
                    });
                }
            }
        } catch (e) {
            console.log("Welcome Event Error:", e.message);
        }
    });
};
