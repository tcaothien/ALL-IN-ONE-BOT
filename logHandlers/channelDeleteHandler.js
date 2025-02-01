const { logsCollection } = require('../mongodb');
const { EmbedBuilder, ChannelType } = require('discord.js');

module.exports = async function channelDeleteHandler(client) {
    client.on('channelDelete', async (channel) => {
        // Tìm kiếm cấu hình ghi log cho sự kiện xóa kênh
        const config = await logsCollection.findOne({ guildId: channel.guild.id, eventType: 'channelDelete' });
        if (!config || !config.channelId) return;

        // Lấy kênh ghi log từ ID đã cấu hình
        const logChannel = client.channels.cache.get(config.channelId);
        if (logChannel) {
  
            // Xác định loại kênh đã bị xóa
            const channelType = {
                [ChannelType.GuildText]: 'Kênh văn bản',
                [ChannelType.GuildVoice]: 'Kênh thoại',
                [ChannelType.GuildCategory]: 'Danh mục',
                [ChannelType.GuildAnnouncement]: 'Kênh thông báo',
                [ChannelType.GuildStageVoice]: 'Kênh sân khấu',
                [ChannelType.GuildForum]: 'Kênh diễn đàn',
                [ChannelType.PublicThread]: 'Luồng công khai',
                [ChannelType.PrivateThread]: 'Luồng riêng tư',
                [ChannelType.GuildDirectory]: 'Kênh thư mục',
            }[channel.type] || 'Loại không xác định';

            // Tạo embed thông báo kênh đã bị xóa
            const embed = new EmbedBuilder()
                .setTitle('🗑️ Kênh đã bị xóa')
                .setColor('#FF0000')
                .addFields(
                    { name: 'Kênh', value: `${channel.name} (${channel.id})`, inline: true },
                    { name: 'Loại', value: channelType, inline: true },
                )
                .setTimestamp();

            // Gửi thông báo vào kênh ghi log
            logChannel.send({ embeds: [embed] });
        }
    });
};
