const { logsCollection } = require('../mongodb');
const { EmbedBuilder } = require('discord.js');

module.exports = async function memberBanHandler(client) {
    client.on('guildBanAdd', async (ban) => {
        // Tìm kiếm cấu hình ghi log cho sự kiện cấm thành viên
        const config = await logsCollection.findOne({ guildId: ban.guild.id, eventType: 'memberBan' });
        if (!config || !config.channelId) return;

        // Lấy kênh ghi log từ ID đã cấu hình
        const logChannel = client.channels.cache.get(config.channelId);
        if (logChannel) {
            // Tạo embed thông báo thành viên bị cấm
            const embed = new EmbedBuilder()
                .setTitle('🔨 Thành viên bị ban')
                .setColor('#FF0000')
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
