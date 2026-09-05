const axios = require('axios');

module.exports = (rememberBot) => {
    rememberBot.ev.on('group-participants.update', async (update) => {
        try {
            const { id, participants, action } = update;

            // Group Check
            if (!id.endsWith('@g.us')) return;

            // Member Add Event Check
            if (action === 'add') {
                for (let num of participants) {
                    const userJid = num;
                    const userName = `@${userJid.split('@')[0]}`;

                    // Group Details Fetching
                    const groupMetadata = await rememberBot.groupMetadata(id);
                    const groupName = groupMetadata.subject;
                    const memberCount = groupMetadata.participants.length;

                    // User Profile Picture
                    let ppUser;
                    try {
                        ppUser = await rememberBot.profilePictureUrl(userJid, 'image');
                    } catch {
                        ppUser = 'https://i.ibb.co/6BRM12f/avatar-contact.png';
                    }

                    // Welcome API Engine
                    const welcomeImgUrl = `https://api.popcat.xyz/welcomecard?background=https://i.ibb.co/4M34dqb/wallpaper.jpg&text1=${encodeURIComponent(userJid.split('@')[0])}&text2=Welcome+To+${encodeURIComponent(groupName)}&text3=Member+${memberCount}&avatar=${encodeURIComponent(ppUser)}`;

                    const response = await axios.get(welcomeImgUrl, { responseType: 'arraybuffer', timeout: 15000 });
                    const imageBuffer = Buffer.from(response.data, 'binary');

                    const welcomeText = `👋 *WELCOME TO THE GROUP!* 👋\n\n` +
                                        `👤 *User:* ${userName}\n` +
                                        `🏰 *Group:* ${groupName}\n` +
                                        `🔢 *Member Count:* #${memberCount}\n\n` +
                                        `> Your Stay And Follow The Rules \n\n REMEMBER-MD`;

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
