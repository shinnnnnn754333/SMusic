const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const play = require('play-dl');
const http = require('http');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildVoiceStates]
});

// Giữ Railway không ngủ đông
http.createServer((req, res) => res.end("Bot SAI Alive!")).listen(process.env.PORT || 3000);

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.content.startsWith('!play')) return;

  const query = message.content.replace('!play', '').trim();
  const voiceChannel = message.member.voice.channel;
  
  if (!voiceChannel) return message.reply('Vào voice đi bé Shin ơi!');

  try {
    const search = await play.search(query, { source: { soundcloud: 'tracks' }, limit: 1 });
    if (!search.length) return message.reply('Không thấy bài nào cả!');

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
    message.reply(`🎵 Đang phát nhạc cho bé Shin: **${search[0].name}**`);
    
  } catch (err) {
    console.error(err);
    message.reply('Bot lỗi, có thể do link nhạc SoundCloud bị chặn hoặc lỗi kết nối!');
  }
});

client.login(process.env.DISCORD_TOKEN_MUSIC);
      
