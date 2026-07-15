const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const play = require('play-dl');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ]
});

const PREFIX = '!'; // Dấu lệnh để gọi bot nhạc

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // Lệnh !play [Tên bài hát hoặc Link]
  if (command === 'play') {
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) {
      return message.reply('Vào phòng voice trước đi chứ!');
    }

    const searchQuery = args.join(' ');
    if (!searchQuery) return message.reply('Nhập tên bài hoặc dán link YouTube vào tớ mới tìm được chứ!');

    try {
      await message.channel.sendTyping();

      let videoUrl = searchQuery;

      // Nếu người dùng không nhập link mà nhập tên bài hát
      if (!play.yt_validate(searchQuery)) {
        // Tiến hành tìm kiếm trên YouTube
        const searchResults = await play.search(searchQuery, { limit: 1 });
        if (searchResults.length === 0) {
          return message.reply('Tớ không tìm thấy bài này trên YouTube rồi.');
        }
        videoUrl = searchResults[0].url;
        message.channel.send(`🔍 Tìm thấy bài: **${searchResults[0].title}**`);
      }

      // Kết nối vào phòng voice
      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: message.guild.id,
        adapterCreator: message.guild.voiceAdapterCreator,
      });

      // Lấy stream nhạc từ YouTube
      const stream = await play.stream(videoUrl);
      const resource = createAudioResource(stream.stream, { inputType: stream.type });
      
      const player = createAudioPlayer();
      player.play(resource);
      connection.subscribe(player);

      message.reply(`🎵 Đang phát nhạc rồi nhé!`);

      player.on(AudioPlayerStatus.Idle, () => {
        connection.destroy(); // Hết nhạc tự động rời phòng
      });

    } catch (error) {
      console.error(error);
      message.reply('Hic, lỗi không phát được nhạc rồi, server đang bị YouTube chặn IP.');
    }
  }

  // Lệnh !stop để tắt nhạc rời phòng
  if (command === 'stop') {
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.reply('Vào phòng voice tắt giùm tớ cái!');
    
    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: message.guild.id,
      adapterCreator: message.guild.voiceAdapterCreator,
    });
    
    if (connection) {
      connection.destroy();
      message.reply('Tớ tắt nhạc và rời phòng đây!');
    }
  }
});

client.once('ready', () => {
  console.log(`[ONLINE] Bot Nhạc SAI đã sẵn sàng tìm kiếm!`);
});

// Nhớ tạo biến môi trường DISCORD_TOKEN_MUSIC trên Railway cho con bot mới này nhé
client.login(process.env.DISCORD_TOKEN_MUSIC);
        
