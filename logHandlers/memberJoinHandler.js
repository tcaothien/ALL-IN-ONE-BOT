const { logsCollection } = require('../mongodb');
const { EmbedBuilder } = require('discord.js');

module.exports = async function memberJoinHandler(client) {
    client.on('guildMemberAdd', async (member) => {
        // Tìm kiếm cấu hình ghi log cho sự kiện thành viên tham gia
        const config = await logsCollection.findOne({ guildId: member.guild.id, eventType: 'memberJoin' });
        if (!config || !config.channelId) return;

        // Lấy kênh ghi log từ ID đã cấu hình
        const logChannel = client.channels.cache.get(config.channelId);
        if (logChannel) {
            // Tạo embed thông báo thành viên mới tham gia
            const embed = new EmbedBuilder()
                .setTitle('🎉 Thành viên mới')
                .setColor('#00FF00')
                .addFields(
                    { name: 'Người dùng', value: `${member.user.tag} (${member.id})`, inline: true },
                    { name: 'Thời gian tham gia', value: new Date().toLocaleString(), inline: true },
                )
                .setThumbnail(member.user.displayAvatarURL())
                .setTimestamp();

            // Gửi thông báo vào kênh ghi log
            logChannel.send({ embeds: [embed] });
        }
    });
};
