const { logsCollection } = require('../mongodb');
const { EmbedBuilder } = require('discord.js');

module.exports = async function messageUpdateHandler(client) {
    client.on('messageUpdate', async (oldMessage, newMessage) => {
        // Kiểm tra nếu tin nhắn không thuộc máy chủ hoặc là tin nhắn một phần
        if (!oldMessage.guild || oldMessage.partial || newMessage.partial) return;

        // Tìm kiếm cấu hình ghi log cho sự kiện cập nhật tin nhắn
        const config = await logsCollection.findOne({ guildId: oldMessage.guild.id, eventType: 'messageUpdate' });
        if (!config || !config.channelId) return;

        // Lấy kênh ghi log từ ID đã cấu hình
        const logChannel = client.channels.cache.get(config.channelId);
        if (logChannel) {
            // Tạo embed thông báo tin nhắn đã được chỉnh sửa
            const embed = new EmbedBuilder()
                .setTitle('✏️ Tin nhắn đã được chỉnh sửa')
                .setColor('#FFFF00')
                .addFields(
                    { name: 'Thành viên', value: oldMessage.author?.tag || 'Không xác định', inline: true },
                    { name: 'Kênh', value: `<#${oldMessage.channel.id}>`, inline: true },
                    { name: 'Nội dung cũ', value: oldMessage.content || '*Không có nội dung*' },
                    { name: 'Nội dung mới', value: newMessage.content || '*Không có nội dung*' },
                )
                .setTimestamp();

            // Gửi thông báo vào kênh ghi log
            logChannel.send({ embeds: [embed] });
        }
    });
};
