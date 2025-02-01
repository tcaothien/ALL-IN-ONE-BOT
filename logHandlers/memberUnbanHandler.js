
const { logsCollection } = require('../mongodb');
const { EmbedBuilder } = require('discord.js');

module.exports = async function memberUnbanHandler(client) {
    client.on('guildBanRemove', async (ban) => {
        // Tìm kiếm cấu hình ghi log cho sự kiện gỡ cấm thành viên
        const config = await logsCollection.findOne({ guildId: ban.guild.id, eventType: 'memberUnban' });
        if (!config || !config.channelId) return;

        // Lấy kênh ghi log từ ID đã cấu hình
        const logChannel = client.channels.cache.get(config.channelId);
        if (logChannel) {
            // Tạo embed thông báo thành viên được gỡ cấm
            const embed = new EmbedBuilder()
                .setTitle('🔓 Thành viên được gỡ ban')
                .setColor('#00FF00')
                .addFields(
                    { name: 'Người dùng', value: `${ban.user.tag} (${ban.user.id})`, inline: true },
                )
                .setThumbnail(ban.user.displayAvatarURL())
                .setTimestamp();

            // Gửi thông báo vào kênh ghi log
            logChannel.send({ embeds: [embed] });
        }
    });
};
