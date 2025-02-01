const { logsCollection } = require('../mongodb');
const { EmbedBuilder } = require('discord.js');

module.exports = async function messageDeleteHandler(client) {
    client.on('messageDelete', async (message) => {
        // Kiểm tra nếu tin nhắn không thuộc máy chủ hoặc là tin nhắn một phần
        if (!message.guild || message.partial) return;

        // Tìm kiếm cấu hình ghi log cho sự kiện xóa tin nhắn
        const config = await logsCollection.findOne({ guildId: message.guild.id, eventType: 'messageDelete' });
        if (!config || !config.channelId) return;

        // Lấy kênh ghi log từ ID đã cấu hình
        const logChannel = client.channels.cache.get(config.channelId);
        if (logChannel) {
            // Tạo embed thông báo tin nhắn đã bị xóa
            const embed = new EmbedBuilder()
                .setTitle('🗑️ Tin nhắn đã bị xóa')
                .setColor('#FF0000')
                .addFields(
                    { name: 'Thành viên', value: message.author?.tag || 'Không xác định', inline: true },
                    { name: 'Kênh', value: `<#${message.channel.id}>`, inline: true },
                    { name: 'Nội dung', value: message.content || '*Không có nội dung*' },
                )
                .setTimestamp();

            // Gửi thông báo vào kênh ghi log
            logChannel.send({ embeds: [embed] });
        }
    });
};
