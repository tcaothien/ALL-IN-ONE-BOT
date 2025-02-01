const { logsCollection } = require('../mongodb');
const { EmbedBuilder } = require('discord.js');

module.exports = async function roleAssignedHandler(client) {
    client.on('guildMemberUpdate', async (oldMember, newMember) => {
        // Lọc các vai trò mới được gán cho thành viên
        const addedRoles = newMember.roles.cache.filter(role => !oldMember.roles.cache.has(role.id));
        if (addedRoles.size === 0) return;

        // Lấy cấu hình ghi log cho sự kiện gán vai trò
        const config = await logsCollection.findOne({ guildId: newMember.guild.id, eventType: 'roleAssigned' });
        if (!config || !config.channelId) return;

        const logChannel = client.channels.cache.get(config.channelId);
        if (logChannel) {
            // Gửi thông báo cho từng vai trò được gán
            addedRoles.forEach(role => {
                const embed = new EmbedBuilder()
                    .setTitle('🔵 Role đã được gán')
                    .setColor('#0000FF')
                    .addFields(
                        { name: 'Thành viên', value: `${newMember.user.tag} (${newMember.id})`, inline: true },
                        { name: 'Vai trò', value: role.name, inline: true },
                    )
                    .setTimestamp();

                logChannel.send({ embeds: [embed] });
            });
        }
    });
};
