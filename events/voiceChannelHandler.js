const { Client, ChannelType, PermissionsBitField, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle  } = require('discord.js');
const { voiceChannelCollection, centralizedControlCollection } = require('../mongodb');

let config = {};

async function loadConfig() {
    try {
        const voiceChannels = await voiceChannelCollection.find({}).toArray();
        config.voiceChannelSetup = voiceChannels.reduce((acc, channel) => {
            acc[channel.serverId] = {
                voiceChannelId: channel.voiceChannelId,
                managerChannelId: channel.managerChannelId,
                status: channel.status
            };
            return acc;
        }, {});
    } catch (err) {
        //console.error('Lỗi khi tải cấu hình từ MongoDB:', err);
        config.voiceChannelSetup = {}; 
    }
}

setInterval(loadConfig, 5000);

setInterval(async () => {
    try {
        const now = Date.now();
        const outdatedChannels = await voiceChannelCollection.find({
            isTemporary: true,
            createdAt: { $lt: new Date(now -  6 * 60 * 60 * 1000) } 
        }).toArray();

        for (const channel of outdatedChannels) {
            const guild = client.guilds.cache.get(channel.guildId);
            if (!guild) continue;

            const channelObj = guild.channels.cache.get(channel.channelId);
            if (channelObj) {
                await channelObj.delete();
            }
            await voiceChannelCollection.deleteOne({ channelId: channel.channelId });
        }
    } catch (error) {
        //console.error('Lỗi khi dọn dẹp:', error);
    }
}, 5000); 

const deleteChannelAfterTimeout = (client, channelId, timeout) => {
    setTimeout(async () => {
        try {
            const row = await voiceChannelCollection.findOne({ channelId });
            if (row) {
                const guild = client.guilds.cache.get(row.guildId);
                if (!guild) return;

                const channel = guild.channels.cache.get(channelId);
                if (channel) {
                    await channel.delete();
                    await voiceChannelCollection.deleteOne({ channelId });
                }
            }
        } catch (error) {
            //console.error('Lỗi khi xóa kênh:', error);
        }
    }, timeout);
};

const sendOrUpdateCentralizedEmbed = async (client, guild) => {
    const guildConfig = config.voiceChannelSetup[guild.id];
    if (!guildConfig) return;

    const managerChannelId = guildConfig.managerChannelId;
    const managerChannel = guild.channels.cache.get(managerChannelId);

    if (!managerChannel) {
        console.log(`Không tìm thấy kênh quản lý cho guild: ${guild.id}`);
        return;
    }

    try {
        const existingControl = await centralizedControlCollection.findOne({ guildId: guild.id });
        const embed = new EmbedBuilder()
            .setAuthor({ 
            name: "Quản lý Kênh Voice", 
            iconURL: "https://cdn.discordapp.com/emojis/1092879273712435262.gif" ,
             url: "https://discord.gg/"
            })
            .setDescription('- Nhấn các nút bên dưới để điều khiển kênh voice của bạn')
            .setColor('#00FF00')
            .addFields([{
                name: 'Cách sử dụng nút',
                value: `
                        🔒 — Khóa kênh voice  
                        🔓 — Mở khóa kênh voice  
                        👻 — Ghost kênh voice  
                        ✨ — Hiển thị kênh voice  
                        🚩 — Claim kênh voice  
                        🚫 — Ngắt kết nối thành viên  
                        🎮 — Bắt đầu hoạt động  
                        ℹ️ — Xem thông tin kênh  
                        ➕ — Tăng giới hạn người dùng  
                        ➖ — Giảm giới hạn người dùng
                    `
            }])
            .setTimestamp();

        const row1 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId('voice_control_lock_channel').setEmoji('🔒').setStyle(ButtonStyle.Secondary), 
                new ButtonBuilder().setCustomId('voice_control_unlock_channel').setEmoji('🔓').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('voice_control_ghost_channel').setEmoji('👻').setStyle(ButtonStyle.Secondary), 
                new ButtonBuilder().setCustomId('voice_control_reveal_channel').setEmoji('✨').setStyle(ButtonStyle.Secondary), 
                new ButtonBuilder().setCustomId('voice_control_claim_channel').setEmoji('🚩').setStyle(ButtonStyle.Secondary) 
            );
        
        const row2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId('voice_control_disconnect_member').setEmoji('🚫').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('voice_control_start_activity').setEmoji('🎮').setStyle(ButtonStyle.Primary), 
                new ButtonBuilder().setCustomId('voice_control_view_channel_info').setEmoji('ℹ️').setStyle(ButtonStyle.Primary), 
                new ButtonBuilder().setCustomId('voice_control_increase_limit').setEmoji('➕').setStyle(ButtonStyle.Primary), 
                new ButtonBuilder().setCustomId('voice_control_decrease_limit').setEmoji('➖').setStyle(ButtonStyle.Primary) 
            );

        if (existingControl) {
            try {
                const message = await managerChannel.messages.fetch(existingControl.messageId);

                if (message.author.id === client.user.id) {
                    await message.edit({ embeds: [embed], components: [row1, row2] });
                } else {
                    await message.delete();
                    const newMessage = await managerChannel.send({ embeds: [embed], components: [row1, row2] });
                    await centralizedControlCollection.updateOne(
                        { guildId: guild.id },
                        { $set: { messageId: newMessage.id } }
                    );
                }
            } catch (fetchError) {
                if (fetchError.code === 10008) { 
                    console.error(`Không tìm thấy tin nhắn cho guild ${guild.id}. Xóa bản ghi cũ.`);
                    await centralizedControlCollection.deleteOne({ guildId: guild.id });
                    const newMessage = await managerChannel.send({ embeds: [embed], components: [row1, row2] });
                    await centralizedControlCollection.insertOne({
                        guildId: guild.id,
                        messageId: newMessage.id,
                    });
                } else {
                    console.error(`Lỗi khi fetch tin nhắn cho guild ${guild.id}:`, fetchError);
                }
            }
        } else {
            const newMessage = await managerChannel.send({ embeds: [embed], components: [row1, row2] });
            await centralizedControlCollection.insertOne({
                guildId: guild.id,
                messageId: newMessage.id,
            });
        }
    } catch (error) {
        console.error(`Lỗi khi xử lý embed tập trung cho guild: ${guild.id}`, error);
    }
};

const checkOutdatedCentralizedControls = async (client) => {
    try {
        const records = await centralizedControlCollection.find({}).toArray();
        for (const record of records) {
            const guild = client.guilds.cache.get(record.guildId);
            if (!guild) continue;

            const managerChannel = guild.channels.cache.get(guild.voiceChannelSetup?.managerChannelId);
            if (!managerChannel) {
                await centralizedControlCollection.deleteOne({ guildId: record.guildId });
                continue;
            }

            try {
                await managerChannel.messages.fetch(record.messageId);
            } catch (fetchError) {
                if (fetchError.code === 10008) {
                    console.error(`Không tìm thấy tin nhắn cho guild ${record.guildId}. Xóa bản ghi cũ.`);
                    await centralizedControlCollection.deleteOne({ guildId: record.guildId });
                    continue;
                } else {
                    console.error(`Lỗi khi fetch tin nhắn cho guild ${record.guildId}:`, fetchError);
                }
            }
        }
    } catch (error) {
        console.error('Lỗi khi kiểm tra các điều khiển tập trung cũ:', error);
    }
};

const handleVoiceStateUpdate = async (client, oldState, newState) => {

    if (oldState.channelId && !newState.channelId) {
        const oldChannel = oldState.channel;

        const voiceChannel = await voiceChannelCollection.findOne({ channelId: oldChannel.id, isTemporary: true });

        if (voiceChannel) {
            if (oldChannel.members.size === 0) {
                try {
                    await oldChannel.delete();
                    //console.log(`Xóa kênh voice trống: ${oldChannel.name}`);
                    await voiceChannelCollection.deleteOne({ channelId: oldChannel.id });
                } catch (error) {
                    //console.error(`Lỗi khi xóa kênh hoặc bản ghi kênh ${oldChannel.id}:`, error);
                }
            }
        }
    }

    if (oldState.channelId === newState.channelId) return;

    const guildId = newState.guild.id;
    const settings = config.voiceChannelSetup[guildId];
    if (!settings || !settings.status) return;

    const { voiceChannelId } = settings;
    const member = newState.member;

    if (newState.channelId === voiceChannelId) {
        try {
            const newChannel = await newState.guild.channels.create({
                name: `${member.user.username}'s channel`,
                type: ChannelType.GuildVoice,
                parent: newState.channel.parentId,
                permissionOverwrites: [
                    {
                        id: member.user.id,
                        allow: [PermissionsBitField.Flags.ManageChannels, PermissionsBitField.Flags.Connect, PermissionsBitField.Flags.Speak]
                    },
                    {
                        id: newState.guild.roles.everyone,
                        deny: [PermissionsBitField.Flags.Connect]
                    }
                ]
            });

            await member.voice.setChannel(newChannel);
           
            await voiceChannelCollection.insertOne({
                id: newChannel.id,
                guildId,
                channelId: newChannel.id,
                userId: member.user.id, 
                createdAt: new Date(),
                isTemporary: true
            });

            deleteChannelAfterTimeout(client, newChannel.id, 6 * 60 * 60 * 1000);
        } catch (error) {
            //console.error('Lỗi khi tạo kênh voice:', error);
        }
    }
};

const handleButtonInteraction = async (interaction) => {

    if (!interaction.isButton()) return;

    const PREFIX = 'voice_control_';

    if (!interaction.customId.startsWith(PREFIX)) return;

    const guild = interaction.guild;
    const userId = interaction.user.id;
    const member = guild.members.cache.get(userId);
    const currentVoiceChannel = member?.voice.channel;

    if (!currentVoiceChannel) {
        return interaction.reply({ content: 'Bạn phải ở trong một kênh voice để thực hiện hành động này.', ephemeral: true });
    }

    const channelId = currentVoiceChannel.id;
    const voiceChannel = await voiceChannelCollection.findOne({ channelId });

    if (!voiceChannel) {
        return interaction.reply({ content: 'Kênh này không được bot quản lý.', ephemeral: true });
    }

    if (voiceChannel.userId !== userId) {
        return interaction.reply({ content: 'Bạn không có quyền quản lý kênh này.', ephemeral: true });
    }

    try {
        const action = interaction.customId.replace(PREFIX, '');

        switch (action) {
            case 'lock_channel':
                await currentVoiceChannel.permissionOverwrites.set([{
                    id: guild.roles.everyone,
                    deny: [PermissionsBitField.Flags.Connect],
                }]);
                await interaction.reply({ content: 'Kênh của bạn đã bị khóa.', ephemeral: true });
                break;

            case 'unlock_channel':
                await currentVoiceChannel.permissionOverwrites.set([{
                    id: guild.roles.everyone,
                    allow: [PermissionsBitField.Flags.Connect],
                }]);
                await interaction.reply({ content: 'Kênh của bạn đã mở khóa.', ephemeral: true });
                break;

            case 'ghost_channel':
                await currentVoiceChannel.permissionOverwrites.set([{
                    id: guild.roles.everyone,
                    deny: [PermissionsBitField.Flags.ViewChannel],
                }]);
                await interaction.reply({ content: 'Kênh của bạn đã bị ghost.', ephemeral: true });
                break;

            case 'reveal_channel':
                await currentVoiceChannel.permissionOverwrites.set([{
                    id: guild.roles.everyone,
                    allow: [PermissionsBitField.Flags.ViewChannel],
                }]);
                await interaction.reply({ content: 'Kênh của bạn đã được hiển thị.', ephemeral: true });
                break;

            case 'claim_channel':
                await interaction.reply({ content: 'Bạn đã claim kênh này.', ephemeral: true });
                break;

            case 'disconnect_member':
                if (currentVoiceChannel.members.size > 1) {
                    const randomMember = currentVoiceChannel.members.random();
                    await randomMember.voice.disconnect();
                    await interaction.reply({ content: `${randomMember.user.tag} đã bị ngắt kết nối.`, ephemeral: true });
                } else {
                    await interaction.reply({ content: 'Không có thành viên nào để ngắt kết nối.', ephemeral: true });
                }
                break;

            case 'start_activity':
                await interaction.reply({ content: 'Bắt đầu hoạt động hiện tại không được hỗ trợ.', ephemeral: true });
                break;

            case 'view_channel_info':
                const info = `Tên kênh: ${currentVoiceChannel.name}\nID kênh: ${currentVoiceChannel.id}`;
                await interaction.reply({ content: info, ephemeral: true });
                break;

            case 'increase_limit':
                if (currentVoiceChannel.userLimit < 99) {
                    await currentVoiceChannel.setUserLimit(currentVoiceChannel.userLimit + 1);
                    await interaction.reply({ content: 'Đã tăng giới hạn người dùng.', ephemeral: true });
                } else {
                    await interaction.reply({ content: 'Đã đạt giới hạn người dùng tối đa.', ephemeral: true });
                }
                break;

            case 'decrease_limit':
                if (currentVoiceChannel.userLimit > 0) {
                    await currentVoiceChannel.setUserLimit(currentVoiceChannel.userLimit - 1);
                    await interaction.reply({ content: 'Đã giảm giới hạn người dùng.', ephemeral: true });
                } else {
                    await interaction.reply({ content: 'Đã đạt giới hạn người dùng tối thiểu.', ephemeral: true });
                }
                break;

            default:
                await interaction.reply({ content: 'Nút không hợp lệ được nhấn.', ephemeral: true });
        }
    } catch (error) {
        console.error('Lỗi khi xử lý tương tác nút:', error);
        await interaction.reply({ content: 'Đã có lỗi xảy ra khi xử lý yêu cầu của bạn.', ephemeral: true });
    }
};

module.exports = (client) => {
    client.on('ready', async () => {
        try {
            await loadConfig();
            client.guilds.cache.forEach(guild => sendOrUpdateCentralizedEmbed(client, guild));
        } catch (error) {
            console.error('Lỗi trong sự kiện ready:', error);
        }
    });

    client.on('voiceStateUpdate', (oldState, newState) => handleVoiceStateUpdate(client, oldState, newState));

    client.on('interactionCreate', async (interaction) => {
        if (interaction.isButton()) {
            await handleButtonInteraction(interaction);
        } else {
            //await handleInteraction(interaction);
        }
    });
};

module.exports.loadConfig = loadConfig;
module.exports.sendOrUpdateCentralizedEmbed = sendOrUpdateCentralizedEmbed;
