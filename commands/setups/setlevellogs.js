const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const { serverLevelingLogsCollection } = require('../../mongodb');
const cmdIcons = require('../../UI/icons/commandicons');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setlevellogs')
        .setDescription('Cài đặt kênh cho nhật ký Level')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild)
        .addStringOption(option =>
            option.setName('channelid')
                .setDescription('ID của kênh nhật ký Level')
                .setRequired(true)),
    async execute(interaction) {
        if (interaction.isCommand && interaction.isCommand()) {
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
                const embed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setDescription('Bạn không có quyền sử dụng lệnh này.');
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }

            const channelId = interaction.options.getString('channelid');
            const serverId = interaction.guild.id;

            const channel = interaction.guild.channels.cache.get(channelId);
            if (!channel) {
                return interaction.reply({ content: 'ID kênh không hợp lệ. Vui lòng cung cấp ID kênh hợp lệ từ server này.', ephemeral: true });
            }

            try {
                await serverLevelingLogsCollection.updateOne(
                    { serverId },
                    { $set: { levelLogsChannelId: channelId } },
                    { upsert: true }
                );

                const embed = new EmbedBuilder()
                    .setColor('#00ff00')
                    .setDescription(`Nhật ký Level đã được cài đặt thành công vào kênh <#${channelId}>.`);
                interaction.reply({ embeds: [embed] });
            } catch (error) {
                console.error('Lỗi khi cài đặt nhật ký Level:', error);

                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setDescription('Đã xảy ra lỗi khi cài đặt kênh nhật ký Level. Vui lòng thử lại sau.');
                interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        } else {
            const embed = new EmbedBuilder()
                .setColor('#3498db')
                .setAuthor({ 
                    name: "Cảnh báo!", 
                    iconURL: cmdIcons.dotIcon ,
                    url: "https://discord.gg/enzlewy"
                })
                .setDescription('- Lệnh này chỉ có thể được sử dụng thông qua lệnh slash!\n- Vui lòng sử dụng `/setlevellogs`')
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        }  
    },
};
