const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, NoSubscriberBehavior } = require('@discordjs/voice');
const play = require('play-dl');
const http = require('http');

// Ép ffmpeg-static hoạt động
require('ffmpeg-static');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildVoiceStates]
});

http.createServer((req, res) => res.end("Bot Alive")).listen(process.env.PORT || 3000);

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.content.startsWith('!play')) return;

  const query = message.content.replace('!play', '').trim();
  if (!query) return message.reply('Gõ tên bài hát đi!');

  const voiceChannel = message.member.voice.channel;
  if (!voiceChannel) return message.reply('Vào phòng voice trước đi!');

  try {
    await message.channel.sendTyping();
    const search = await play.search(query, { source: { soundcloud: 'tracks' }, limit: 1 });
    if (!search.length) return message.reply('Không tìm thấy bài.');

    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: message.guild.id,
      adapterCreator: message.guild.voiceAdapterCreator,
      selfDeaf: false
    });

    const stream = await play.stream(search[0].url);
    const resource = createAudioResource(stream.stream, { inputType: stream.type });
    const player = createAudioPlayer();

    player.play(resource);
    connection.subscribe(player);
    
    message.reply(`🎵 Đang phát: **${search[0].name}**`);
    
    player.on('error', err => {
        console.error(err);
        message.channel.send('Lỗi luồng âm thanh rồi!');
    });
  } catch (err) {
    console.error(err);
    message.reply('Không phát được, kiểm tra lại quyền voice đi!');
  }
});

client.login(process.env.DISCORD_TOKEN_MUSIC);
      
