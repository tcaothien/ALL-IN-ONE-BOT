const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');
const { logsCollection } = require('../../mongodb');
const cmdIcons = require('../../UI/icons/commandicons');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setlogs')
        .setDescription('Cấu hình các kênh ghi nhật ký sự kiện cho server hoặc tất cả sự kiện.')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild)
        .addSubcommand(subcommand =>
            subcommand
                .setName('event')
                .setDescription('Cài đặt kênh ghi nhật ký cho một sự kiện cụ thể.')
                .addStringOption(option =>
                    option.setName('event')
                        .setDescription('Sự kiện để ghi nhật ký.')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Tin nhắn bị xóa', value: 'messageDelete' },
                            { name: 'Tin nhắn được cập nhật', value: 'messageUpdate' },
                            { name: 'Thành viên gia nhập', value: 'memberJoin' },
                            { name: 'Thành viên rời đi', value: 'memberLeave' },
                            { name: 'Vai trò được tạo', value: 'roleCreate' },
                            { name: 'Vai trò bị xóa', value: 'roleDelete' },
                            { name: 'Thành viên bị cấm', value: 'memberBan' },
                            { name: 'Thành viên được mở khóa', value: 'memberUnban' },
                            { name: 'Tham gia kênh thoại', value: 'voiceJoin' },
                            { name: 'Rời khỏi kênh thoại', value: 'voiceLeave' },
                            { name: 'Kênh được tạo', value: 'channelCreate' },
                            { name: 'Kênh bị xóa', value: 'channelDelete' },
                            { name: 'Vai trò được gán cho người dùng', value: 'roleAssigned' },
                            { name: 'Vai trò bị xóa khỏi người dùng', value: 'roleRemoved' },
                            { name: 'Biệt danh thay đổi', value: 'nicknameChange' },
                            { name: 'Nhật ký quản trị', value: 'moderationLogs' },
                        ))
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Kênh để ghi sự kiện này.')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('all')
                .setDescription('Cài đặt kênh ghi nhật ký cho tất cả sự kiện.')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Kênh để ghi tất cả sự kiện.')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('Xem tất cả các kênh ghi nhật ký đã được cấu hình.')),
    async execute(interaction) {
        if (interaction.isCommand && interaction.isCommand()) {
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
                const embed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setDescription('Bạn không có quyền sử dụng lệnh này.');
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }

            const subcommand = interaction.options.getSubcommand();
            const guildId = interaction.guild.id;

            if (subcommand === 'event') {
                const eventType = interaction.options.getString('event');
                const channel = interaction.options.getChannel('channel');

                if (!channel.isTextBased()) {
                    return interaction.reply({ content: 'Vui lòng chọn một kênh có thể gửi tin nhắn.', ephemeral: true });
                }

                await logsCollection.updateOne(
                    { guildId, eventType },
                    { $set: { channelId: channel.id } },
                    { upsert: true }
                );

                return interaction.reply({
                    content: `Nhật ký cho sự kiện **${eventType}** sẽ được gửi đến <#${channel.id}>.`,
                    ephemeral: true,
                });
            }

            if (subcommand === 'all') {
                const channel = interaction.options.getChannel('channel');

                if (!channel.isTextBased()) {
                    return interaction.reply({ content: 'Vui lòng chọn một kênh có thể gửi tin nhắn.', ephemeral: true });
                }

                const eventTypes = [
                    'messageDelete', 'messageUpdate', 'memberJoin', 'memberLeave',
                    'roleCreate', 'roleDelete', 'memberBan', 'memberUnban',
                    'voiceJoin', 'voiceLeave', 'channelCreate', 'channelDelete',
                    'roleAssigned', 'roleRemoved', 'nicknameChange', 'moderationLogs',
                ];

                await Promise.all(
                    eventTypes.map(eventType =>
                        logsCollection.updateOne(
                            { guildId, eventType },
                            { $set: { channelId: channel.id } },
                            { upsert: true }
                        )
                    )
                );

                return interaction.reply({
                    content: `Nhật ký cho tất cả sự kiện sẽ được gửi đến <#${channel.id}>.`,
                    ephemeral: true,
                });
            }

            if (subcommand === 'view') {
                const configs = await logsCollection.find({ guildId }).toArray();

                if (configs.length === 0) {
                    return interaction.reply({ content: 'Chưa có kênh nhật ký nào được cấu hình.', ephemeral: true });
                }

                const embed = new EmbedBuilder()
                    .setTitle('Các kênh nhật ký đã được cấu hình')
                    .setColor('#00FFFF');

                configs.forEach(config => {
                    embed.addFields({
                        name: config.eventType,
                        value: `<#${config.channelId}>`,
                        inline: true,
                    });
                });

                return interaction.reply({ embeds: [embed], ephemeral: true });
            }

        } else {
            const embed = new EmbedBuilder()
                .setColor('#3498db')
                .setAuthor({ 
                    name: "Cảnh báo!", 
                    iconURL: cmdIcons.dotIcon ,
                    url: "https://discord.gg/enzlewy"
                })
                .setDescription('- Lệnh này chỉ có thể được sử dụng thông qua lệnh slash!\n- Vui lòng sử dụng `/setlogs`')
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        }
    },
};
