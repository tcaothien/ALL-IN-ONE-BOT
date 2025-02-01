const { logsCollection } = require('../mongodb');
const { EmbedBuilder } = require('discord.js');

module.exports = async function voiceLeaveHandler(client) {
    client.on('voiceStateUpdate', async (oldState, newState) => {
        // Nếu không có kênh hoặc người dùng không thay đổi kênh, thì không làm gì
        if (!oldState.channel || oldState.channelId === newState.channelId) return;

        // Lấy cấu hình ghi log cho sự kiện rời kênh thoại
        const config = await logsCollection.findOne({ guildId: oldState.guild.id, eventType: 'voiceLeave' });
        if (!config || !config.channelId) return;

        const logChannel = client.channels.cache.get(config.channelId);
        if (logChannel) {
            const embed = new EmbedBuilder()
                .setTitle('🎤 Đã rời kênh thoại')
                .setColor('#FF9900')
                .addFields(
                    { name: 'Thành viên', value: `${oldState.member.user.tag} (${oldState.member.id})`, inline: true },
                    { name: 'Kênh', value: `${oldState.channel.name} (${oldState.channel.id})`, inline: true },
                )
                .setTimestamp();

            logChannel.send({ embeds: [embed] });
        }
    });
};
