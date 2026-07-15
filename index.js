const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const ytdl = require('ytdl-core');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildVoiceStates]
});

client.on('messageCreate', async message => {
    if (message.author.bot || !message.content.startsWith('!play')) return;

    const args = message.content.split(' ');
    const url = args[1];
    if (!url) return message.reply('Đưa link YouTube đây tao phát cho!');

    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.reply('Vào phòng voice trước đi bé Shin!');

    const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: message.guild.id,
        adapterCreator: message.guild.voiceAdapterCreator,
    });

    const player = createAudioPlayer();
    
    // Tải âm thanh trực tiếp từ link
    const stream = ytdl(url, { filter: 'audioonly', highWaterMark: 1 << 25 });
    const resource = createAudioResource(stream);

    connection.subscribe(player);
    player.play(resource);
    
    message.reply('Đang phát nhạc cho mày, chờ tí...');
    
    player.on(AudioPlayerStatus.Idle, () => connection.destroy());
});

client.login(process.env.DISCORD_TOKEN);
