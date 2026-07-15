const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, NoSubscriberBehavior } = require('@discordjs/voice');
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
  res.write("Bot nhac SAI Direct Link dang chay!");
  res.end();
}).listen(port);

const PREFIX = '!';

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // Lệnh phát bằng link trực tiếp: !play [Link]
  if (command === 'play') {
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.reply('Vào phòng voice trước đi chứ!');

    let streamUrl = args[0];
    if (!streamUrl) return message.reply('Đưa cái link nhạc đây tớ mở cho!');

    try {
      await message.channel.sendTyping();

      // Mẹo tự chuyển đổi nếu người dùng dán link chia sẻ từ Google Drive
      if (streamUrl.includes('drive.google.com/file/d/')) {
        const fileId = streamUrl.split('/d/')[1].split('/')[0];
        streamUrl = `https://docs.google.com/uc?export=download&id=${fileId}`;
      }

      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: message.guild.id,
        adapterCreator: message.guild.voiceAdapterCreator,
      });

      // Tạo nguồn âm thanh trực tiếp từ URL
      const resource = createAudioResource(streamUrl);
      
      const player = createAudioPlayer({
        behaviors: { noSubscriber: NoSubscriberBehavior.Play }
      });
      
      player.play(resource);
      connection.subscribe(player);

      message.reply(`🎵 Đang phát nhạc từ liên kết cậu gửi rồi nhé!`);

      player.on(AudioPlayerStatus.Idle, () => {
        connection.destroy(); // Hết nhạc tự động out phòng
      });

      player.on('error', error => {
        console.error(error);
        message.reply('Hic, liên kết này không phát được hoặc bị lỗi định dạng rồi.');
      });

    } catch (error) {
      console.error(error);
      message.reply('Lỗi rồi, không thể kết nối hoặc tải file nhạc.');
    }
  }

  // Lệnh dừng nhạc out phòng: !stop
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
      message.reply('Tắt nhạc! Rời phòng đây.');
    }
  }
});

client.once('ready', () => {
  console.log(`[ONLINE] Bot Nhạc Phát Link đã sẵn sàng!`);
});

client.login(process.env.DISCORD_TOKEN_MUSIC);

