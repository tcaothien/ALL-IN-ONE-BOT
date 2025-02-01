const { logsCollection } = require('../mongodb');
const { EmbedBuilder, ChannelType } = require('discord.js');

module.exports = async function channelCreateHandler(client) {
    client.on('channelCreate', async (channel) => {
        // Tìm kiếm cấu hình ghi log cho sự kiện tạo kênh
        const config = await logsCollection.findOne({ guildId: channel.guild.id, eventType: 'channelCreate' });
        if (!config || !config.channelId) return;

        // Lấy kênh ghi log từ ID đã cấu hình
        const logChannel = client.channels.cache.get(config.channelId);
        if (logChannel) {

            // Xác định loại kênh được tạo
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

            // Tạo embed thông báo kênh mới được tạo
            const embed = new EmbedBuilder()
                .setTitle('📢 Kênh đã được tạo')
                .setColor('#00FF00')
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
