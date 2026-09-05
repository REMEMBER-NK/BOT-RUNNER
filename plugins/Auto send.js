module.exports = (rememberBot) => {
    // Group Participant Update Listener
    rememberBot.ev.on('group-participants.update', async (update) => {
        try {
            const { id, participants, action } = update;

            // Group Check Guard (@g.us)
            if (!id || !id.endsWith('@g.us')) return;

            // Member Add Event Only
            if (action === 'add') {
                for (let num of participants) {
                    const userJid = num;
                    const userName = `@${userJid.split('@')[0]}`;

                    // Group Details Fetch
                    let groupName = "Group";
                    let memberCount = "1+";
                    try {
                        const groupMetadata = await rememberBot.groupMetadata(id);
                        groupName = groupMetadata.subject || "Group";
                        memberCount = groupMetadata.participants ? groupMetadata.participants.length : "1+";
                    } catch (err) {
                        console.log("Metadata Fetch Warning:", err.message);
                    }

                    // User Profile Picture URL
                    let ppUser;
                    try {
                        ppUser = await rememberBot.profilePictureUrl(userJid, 'image');
                    } catch {
                        ppUser = 'https://i.ibb.co/6BRM12f/avatar-contact.png';
                    }

                    // Welcome Card Image URL Engine
                    const welcomeImgUrl = `https://api.popcat.xyz/welcomecard?background=https://i.ibb.co/4M34dqb/wallpaper.jpg&text1=${encodeURIComponent(userJid.split('@')[0])}&text2=Welcome+To+${encodeURIComponent(groupName)}&text3=Member+${memberCount}&avatar=${encodeURIComponent(ppUser)}`;

                    const welcomeText = `👋 *WELCOME TO THE GROUP!* 👋\n\n` +
                                        `👤 *User:* ${userName}\n` +
                                        `🏰 *Group:* ${groupName}\n` +
                                        `🔢 *Member Count:* #${memberCount}\n\n` +
                                        `> Powered by REMEMBER-MD`;

                    // Send Direct Image Object (No Axios Buffer Errors)
                    await rememberBot.sendMessage(id, {
                        image: { url: welcomeImgUrl },
                        caption: welcomeText,
                        mentions: [userJid]
                    });
                }
            }
        } catch (e) {
            console.log("Welcome Event Internal Error:", e.message);
        }
    });
};
