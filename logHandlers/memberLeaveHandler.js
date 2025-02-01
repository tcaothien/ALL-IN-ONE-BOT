const { logsCollection } = require('../mongodb');
const { EmbedBuilder } = require('discord.js');

module.exports = async function memberLeaveHandler(client) {
    client.on('guildMemberRemove', async (member) => {
        // Tìm kiếm cấu hình ghi log cho sự kiện thành viên rời đi
        const config = await logsCollection.findOne({ guildId: member.guild.id, eventType: 'memberLeave' });
        if (!config || !config.channelId) return;

        // Lấy kênh ghi log từ ID đã cấu hình
        const logChannel = client.channels.cache.get(config.channelId);
        if (logChannel) {
            // Tạo embed thông báo thành viên rời khỏi máy chủ
            const embed = new EmbedBuilder()
                .setTitle('🚶 Thành viên đã rời máy chủ')
                .setColor('#FF9900')
                .addFields(
                    { name: 'Người dùng', value: `${member.user.tag} (${member.id})`, inline: true },
                    { name: 'Thời gian rời đi', value: new Date().toLocaleString(), inline: true },
                )
                .setThumbnail(member.user.displayAvatarURL())
                .setTimestamp();

            // Gửi thông báo vào kênh ghi log
            logChannel.send({ embeds: [embed] });
        }
    });
};
