const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');
const { serverConfigCollection } = require('../mongodb');
const configPath = path.join(__dirname, '..', 'config.json');
const lang = require('./loadLanguage');
const cmdIcons = require('../UI/icons/commandicons'); 
const { serverLevelingLogsCollection } = require('../mongodb');
const afkHandler = require('./afkHandler');
const { updateXp, getUserData } = require('../models/users');
const { getUserCommands } = require('../models/customCommands');
module.exports = {
    name: 'messageCreate',
    async execute(message, client) {


    
        try {
            const { handleAFKRemoval, handleMentions } = afkHandler(client);
            await handleAFKRemoval(message);
            await handleMentions(message);
        } catch (afkError) {
            console.error('Lỗi xử lý AFK:', afkError);
        }

        
        let xpGain = 10;

 
        if (message.attachments.size > 0) {
            xpGain += 5; 
        }

        if (/(https?:\/\/[^\s]+)/g.test(message.content)) {
            xpGain += 5; 
        }

 
        const { xp, level } = await updateXp(message.author.id, xpGain);
        const oldLevel = Math.floor(0.1 * Math.sqrt(xp - xpGain));

   
        const userData = await getUserData(message.author.id);

      
        if (level > oldLevel) {
            const logChannelId = await serverLevelingLogsCollection.findOne({ serverId: message.guild.id })
                .then(config => config?.levelLogsChannelId);

            const levelUpMessage = `${message.author}, bạn đã lên **level ${level}!** 🎉`;

            
            const embed = new EmbedBuilder()
                .setColor('FF0000') 
                .setAuthor({
                    name: 'Level Up!',
                    iconURL: cmdIcons.rippleIcon,
                    url: 'https://discord.gg/enzlewy', 
                })
                .setDescription(`🎉 **Chúc mừng, ${message.author}!**\nBạn đã đạt được **Level ${level}**!`)
                .setThumbnail(message.author.displayAvatarURL({ format: 'png', dynamic: true }))
                .addFields(
                    { name: '📊 Level hiện tại', value: `**${level}**`, inline: true },
                    { name: '💫 XP đạt được trong tuần', value: `**${userData.weeklyXp || 0} XP**`, inline: true },
                    { name: '\u200B', value: '\u200B' },
                    { name: '📈 Tổng XP', value: `**${userData.xp || 0} XP**`, inline: true },
                    { name: '✨ XP đến level tiếp theo', value: `**${Math.ceil(Math.pow((level + 1) / 0.1, 2) - xp)} XP**`, inline: true },
                )
                .setFooter({ text: 'Hãy chat thêm điiii!', iconURL: cmdIcons.levelUpIcon })
                .setTimestamp();

            if (logChannelId) {
                const logChannel = message.guild.channels.cache.get(logChannelId);
                if (logChannel) {
                    logChannel.send({ content: levelUpMessage, embeds: [embed] });
                }
            } else {
                message.channel.send({ content: levelUpMessage, embeds: [embed] });
            }
        }
        
            let config;
        
        try {
            const data = fs.readFileSync(configPath, 'utf8');
            config = JSON.parse(data);
        } catch (err) {
            //console.error('Lỗi khi đọc hoặc phân tích tệp cấu hình:', err);
            return message.reply(lang.error);
        }

        let serverConfig;
        try {
            serverConfig = await serverConfigCollection.findOne({ serverId: message.guild.id });
        } catch (err) {
            //console.error('Lỗi khi lấy cấu hình máy chủ từ MongoDB:', err);
        }

       
        const prefix = (serverConfig && serverConfig.prefix) || config.prefix;

        if (!message.content.startsWith(prefix)) return;

        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

       
        const customCommands = await getUserCommands(message.author.id);
        const customCommand = customCommands.find(cmd => cmd.commandName === commandName);

        if (customCommand) {
            try {
                message.reply(customCommand.response);
            } catch (error) {
                console.error('Lỗi khi thực thi lệnh tùy chỉnh:', error);
                message.reply('Đã có lỗi xảy ra khi thực thi lệnh tùy chỉnh của bạn!');
            }
            return; 
        }

        const command = client.commands.get(commandName);
        if (!command) return;


        const category = command.category || 'undefined';

    
        if (command.source === 'shiva') {
            try {
                await command.execute(message, args, client);
            } catch (error) {
                //console.error(error);
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('Lỗi Lệnh')
                    .setDescription(lang.commandError.replace('{commandName}', commandName))
                    .addFields({ name: 'Chi tiết lỗi:', value: error.message });

                message.reply({ embeds: [errorEmbed] });
            }
            return;
        }

       
        if (!config.categories[category]) {
            try {
                //await message.reply({ content: `Lệnh trong danh mục \`${category}\` đã bị vô hiệu hóa.` });
            } catch (replyError) {
                //console.error('Lỗi khi gửi phản hồi lệnh bị vô hiệu hóa:', replyError);
            }
            return;
        }
        
        try {
            await command.execute(message, args, client);
        } catch (error) {
            console.error(error);
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('Lỗi Lệnh')
                .setDescription(lang.commandError.replace('{commandName}', commandName))
                .addFields({ name: 'Chi tiết lỗi:', value: error.message });

            message.reply({ embeds: [errorEmbed] });
        }
    },
};
