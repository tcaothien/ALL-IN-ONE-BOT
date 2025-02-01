const { nicknameConfigs } = require('../mongodb'); 
const { EmbedBuilder } = require('discord.js');

module.exports = async function autoNicknameHandler(client) {
    client.on('guildMemberAdd', async (member) => {
        const guildId = member.guild.id;

        // Tìm kiếm cấu hình đặt biệt danh tự động cho server
        const config = await nicknameConfigs.findOne({ guildId });

        // Nếu không có cấu hình hoặc tính năng không được bật, thoát khỏi hàm
        if (!config || !config.status) return;

        const prefix = config.nicknamePrefix;

        // Tạo biệt danh mới với tiền tố được đặt trong cấu hình
        const newNickname = `${prefix} ${member.user.username}`;

        try {
            await member.setNickname(newNickname);
            // console.log(`Biệt danh của ${member.user.tag} đã được đổi thành: ${newNickname}`);
        } catch (error) {
            // console.error(`Không thể đặt biệt danh cho ${member.user.tag}: ${error.message}`);
        }

        // Ghi log vào kênh 'logs' nếu có
        // const logChannel = member.guild.channels.cache.find(
        //     channel => channel.name === 'logs' && channel.isTextBased()
        // );
        // if (logChannel) {
        //     const embed = new EmbedBuilder()
        //         .setTitle('🔄 Biệt danh đã được thay đổi')
        //         .setColor('#00FF00')
        //         .addFields(
        //             { name: 'Người dùng', value: `${member.user.tag} (${member.id})`, inline: true },
        //             { name: 'Biệt danh mới', value: newNickname, inline: true },
        //         )
        //         .setTimestamp();

        //     logChannel.send({ embeds: [embed] });
        // }
    });
};
