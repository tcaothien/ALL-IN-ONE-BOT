const { commandLogsCollection } = require('../mongodb');
const { EmbedBuilder } = require('discord.js');

module.exports = async function commandExecutionHandler(client) {
    client.on('interactionCreate', async (interaction) => {
        if (!interaction.isCommand()) return;

        const { commandName, user, guild, channel } = interaction;
        const logData = {
            commandName,
            userId: user.id,
            userName: user.tag,
            guildId: guild?.id || null,
            channelId: channel.id,
            timestamp: new Date(),
        };

        // Lưu thông tin lệnh đã được thực thi vào cơ sở dữ liệu
        await commandLogsCollection.insertOne(logData);

        if (guild) {
            // Kiểm tra cấu hình ghi log của máy chủ
            const config = await commandLogsCollection.findOne({ guildId: guild.id });

            if (config && config.channelId) {
                // Lấy kênh ghi log từ ID đã cấu hình
                const logChannel = client.channels.cache.get(config.channelId);
                if (logChannel) {
                    // Tạo embed thông báo lệnh đã được thực thi
                    const embed = new EmbedBuilder()
                        .setTitle('📜 Lệnh đã được thực thi')
                        .setColor('#3498db')
                        .addFields(
                            { name: 'Người dùng', value: `${user.tag} (${user.id})`, inline: true },
                            { name: 'Lệnh', value: `/${commandName}`, inline: true },
                            { name: 'Kênh', value: `<#${channel.id}>`, inline: true },
                        )
                        .setTimestamp();

                    // Gửi thông báo vào kênh ghi log
                    logChannel.send({ embeds: [embed] });
                }
            }
        }
    });
};
