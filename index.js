const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, NoSubscriberBehavior } = require('@discordjs/voice');
const play = require('play-dl');
const http = require('http');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ]
});

// Tạo cổng mạng ảo để giữ Railway không kill bot
const port = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.write("Bot nhac SAI Tu Kiem Nhac dang chay!");
  res.end();
}).listen(port);

const PREFIX = '!';

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // Lệnh tự kiếm và phát nhạc: !play [Tên bài hát hoặc Link YouTube]
  if (command === 'play') {
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.reply('Vào phòng voice trước đi ông nội!');

    const searchQuery = args.join(' ');
    if (!searchQuery) return message.reply('Gõ tên bài hát tớ mới tìm được chứ!');

    try {
      await message.channel.sendTyping();
      let videoUrl = searchQuery;

      // Nếu người dùng gõ tên bài, tự động lên YT tìm bài đầu tiên
      if (!play.yt_validate(searchQuery)) {
        const searchResults = await play.search(searchQuery, { limit: 1 });
        if (searchResults.length === 0) {
          return message.reply('Tớ không tìm thấy bài này trên YouTube rồi.');
        }
        videoUrl = searchResults[0].url;
        message.channel.send(`🔍 Đã tìm thấy: **${searchResults[0].title}**`);
      }

      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: message.guild.id,
        adapterCreator: message.guild.voiceAdapterCreator,
      });

      // Lấy stream nhạc trực tiếp từ YouTube
      const stream = await play.stream(videoUrl, { quality: 2 });
      const resource = createAudioResource(stream.stream, { inputType: stream.type });
      
      const player = createAudioPlayer({
        behaviors: { noSubscriber: NoSubscriberBehavior.Play }
      });
      
      player.play(resource);
      connection.subscribe(player);

      message.reply(`🎵 Đang phát nhạc rồi nhé anh em!`);

      player.on(AudioPlayerStatus.Idle, () => {
        connection.destroy(); // Hết nhạc tự cút
      });

      player.on('error', error => {
        console.error(error);
        message.reply('Hic, luồng âm thanh bị lỗi rồi!');
      });

    } catch (error) {
      console.error(error);
      message.reply('Lỗi rồi, server vẫn bị YouTube chặn IP, để tớ tính cách khác.');
    }
  }

  // Lệnh tắt nhạc rời phòng: !stop
  if (command === 'stop') {
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.reply('Vào phòng voice mới bắt tớ tắt được.');
    
    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: message.guild.id,
      adapterCreator: message.guild.voiceAdapterCreator,
    });
    
    if (connection) {
      connection.destroy();
      message.reply('Tắt nhạc! Rời phòng liền đây.');
    }
  }
});

client.once('ready', () => {
  console.log(`[ONLINE] Bot Nhạc Tự Kiếm đã sẵn sàng!`);
});

client.login(process.env.DISCORD_TOKEN_MUSIC);
  
