const { logsCollection } = require('../mongodb');
const { EmbedBuilder } = require('discord.js');

module.exports = async function moderationLogsHandler(client) {
    client.on('guildMemberUpdate', async (oldMember, newMember) => {
        const guildId = newMember.guild.id;

        // Lấy cấu hình ghi log
        const config = await logsCollection.findOne({ guildId, eventType: 'moderationLogs' });
        if (!config || !config.channelId) return;

        const logChannel = newMember.guild.channels.cache.get(config.channelId);

        // Kiểm tra nếu có thay đổi về thời gian tạm khóa (timeout)
        if (oldMember.communicationDisabledUntilTimestamp !== newMember.communicationDisabledUntilTimestamp) {
            const embed = new EmbedBuilder()
                .setTitle('⏳ Thay đổi thời gian tạm khóa')
                .setColor('#FF9900')
                .addFields(
                    { name: 'Thành viên', value: `${newMember.user.tag} (${newMember.id})`, inline: true },
                    { name: 'Thời gian tạm khóa đến', value: newMember.communicationDisabledUntil
                        ? `<t:${Math.floor(newMember.communicationDisabledUntilTimestamp / 1000)}:F>`
                        : '*Không có*', inline: true },
                )
                .setTimestamp();

            logChannel.send({ embeds: [embed] });
        }
    });
};
