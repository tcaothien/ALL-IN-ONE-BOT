const { logsCollection } = require('../mongodb');
const { EmbedBuilder } = require('discord.js');

module.exports = async function nicknameChangeHandler(client) {
    client.on('guildMemberUpdate', async (oldMember, newMember) => {
        const guildId = newMember.guild.id;

        // Lấy cấu hình ghi log
        const config = await logsCollection.findOne({ guildId, eventType: 'nicknameChange' });
        if (!config || !config.channelId) return;

        const logChannel = newMember.guild.channels.cache.get(config.channelId);

        // Kiểm tra nếu tên hiển thị của thành viên thay đổi
        if (logChannel && oldMember.nickname !== newMember.nickname) {
            const embed = new EmbedBuilder()
                .setTitle('📝 Tên hiển thị đã thay đổi')
                .setColor('#00FFFF')
                .addFields(
                    { name: 'Thành viên', value: `${newMember.user.tag} (${newMember.id})`, inline: true },
                    { name: 'Tên hiển thị cũ', value: oldMember.nickname || '*Không có*', inline: true },
                    { name: 'Tên hiển thị mới', value: newMember.nickname || '*Không có*', inline: true },
                )
                .setTimestamp();

            logChannel.send({ embeds: [embed] });
        }
    });
};
