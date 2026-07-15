const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource } = require('@discordjs/voice');
const play = require('play-dl');
const http = require('http');

// Tắt thông báo cookie để tránh lỗi kết nối
play.setToken({ youtube : { cookie : "" } }); 

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildVoiceStates]
});

http.createServer((req, res) => res.end("Bot Alive")).listen(process.env.PORT || 3000);

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.content.startsWith('!play')) return;

  const query = message.content.replace('!play', '').trim();
  const voiceChannel = message.member.voice.channel;
  if (!voiceChannel) return message.reply('Vào voice đi mạy!');

  try {
    // CHUYỂN SANG TÌM YOUTUBE
    const search = await play.search(query, { source: { youtube: 'video' }, limit: 1 });
    if (!search.length) return message.reply('Đéo tìm thấy trên YouTube!');

    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: message.guild.id,
      adapterCreator: message.guild.voiceAdapterCreator,
      selfDeaf: false, selfMute: false
    });

    // Ép lấy luồng âm thanh từ YouTube
    const stream = await play.stream(search[0].url);
    const resource = createAudioResource(stream.stream, { inputType: stream.type });
    const player = createAudioPlayer();

    player.play(resource);
    connection.subscribe(player);
    message.reply(`🎵 Đang quẩy: **${search[0].title}** (Nguồn YouTube)`);
  } catch (err) {
    console.error(err);
    message.reply('YouTube nó chặn IP Railway rồi, bot gục!');
  }
});

client.login(process.env.DISCORD_TOKEN_MUSIC);
                                                       
