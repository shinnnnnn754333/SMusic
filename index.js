const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const play = require('play-dl');
const http = require('http');

// Ép ffmpeg hoạt động
require('ffmpeg-static');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ]
});

// Giữ Railway luôn tỉnh táo
http.createServer((req, res) => res.end("Bot SAI Alive!")).listen(process.env.PORT || 3000);

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.content.startsWith('!play')) return;

  const query = message.content.replace('!play', '').trim();
  if (!query) return message.reply('Gõ tên bài hát đi ông nội!');

  const voiceChannel = message.member.voice.channel;
  if (!voiceChannel) return message.reply('Vào phòng voice đi mạy!');

  try {
    await message.channel.sendTyping();
    const search = await play.search(query, { source: { soundcloud: 'tracks' }, limit: 1 });
    if (!search.length) return message.reply('Đéo tìm thấy bài hát này!');

    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: message.guild.id,
      adapterCreator: message.guild.voiceAdapterCreator,
      selfDeaf: false,
      selfMute: false
    });

    const stream = await play.stream(search[0].url);
    const resource = createAudioResource(stream.stream, { inputType: stream.type });
    const player = createAudioPlayer();

    player.play(resource);
    connection.subscribe(player);
    
    message.reply(`🎵 Đang phát: **${search[0].name}** - Quẩy thôi!`);
    
    player.on('error', err => {
        console.error(err);
        message.channel.send('Lỗi luồng âm thanh rồi!');
    });
  } catch (err) {
    console.error(err);
    message.reply('Không phát được, check lại quyền trong kênh đi!');
  }
});

client.login(process.env.DISCORD_TOKEN_MUSIC);
      
