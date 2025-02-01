const { logsCollection } = require('../mongodb');
const { EmbedBuilder } = require('discord.js');

module.exports = async function roleDeleteHandler(client) {
    client.on('roleDelete', async (role) => {
        // Lấy cấu hình ghi log cho sự kiện xóa vai trò
        const config = await logsCollection.findOne({ guildId: role.guild.id, eventType: 'roleDelete' });
        if (!config || !config.channelId) return;

        const logChannel = client.channels.cache.get(config.channelId);
        if (logChannel) {
            const embed = new EmbedBuilder()
                .setTitle('🔴 Role đã bị xóa')
                .setColor('#FF0000')
                .addFields(
                    { name: 'Role', value: `${role.name} (${role.id})`, inline: true },
                )
                .setTimestamp();

            logChannel.send({ embeds: [embed] });
        }
    });
};
