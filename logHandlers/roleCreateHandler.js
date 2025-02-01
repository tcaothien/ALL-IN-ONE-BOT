const { logsCollection } = require('../mongodb');
const { EmbedBuilder } = require('discord.js');

module.exports = async function roleCreateHandler(client) {
    client.on('roleCreate', async (role) => {
        // Lấy cấu hình ghi log cho sự kiện tạo vai trò
        const config = await logsCollection.findOne({ guildId: role.guild.id, eventType: 'roleCreate' });
        if (!config || !config.channelId) return;

        const logChannel = client.channels.cache.get(config.channelId);
        if (logChannel) {
            const embed = new EmbedBuilder()
                .setTitle('🟢 Role đã được tạo')
                .setColor('#00FF00')
                .addFields(
                    { name: 'Role', value: `${role.name} (${role.id})`, inline: true },
                    { name: 'Màu', value: role.hexColor, inline: true },
                )
                .setTimestamp();

            logChannel.send({ embeds: [embed] });
        }
    });
};
