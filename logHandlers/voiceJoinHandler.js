const { logsCollection } = require('../mongodb');
const { EmbedBuilder } = require('discord.js');

module.exports = async function voiceJoinHandler(client) {
    client.on('voiceStateUpdate', async (oldState, newState) => {
        // Nếu không có kênh hoặc người dùng không thay đổi kênh, thì không làm gì
        if (!newState.channel || oldState.channelId === newState.channelId) return;

        // Lấy cấu hình ghi log cho sự kiện tham gia kênh thoại
        const config = await logsCollection.findOne({ guildId: newState.guild.id, eventType: 'voiceJoin' });
        if (!config || !config.channelId) return;

        const logChannel = client.channels.cache.get(config.channelId);
        if (logChannel) {
            const embed = new EmbedBuilder()
                .setTitle('🎤 Đã tham gia kênh thoại')
                .setColor('#00FFFF')
                .addFields(
                    { name: 'Thành viên', value: `${newState.member.user.tag} (${newState.member.id})`, inline: true },
                    { name: 'Kênh', value: `${newState.channel.name} (${newState.channel.id})`, inline: true },
                )
                .setTimestamp();

            logChannel.send({ embeds: [embed] });
        }
    });
};
