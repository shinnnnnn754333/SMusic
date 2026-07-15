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

// Tạo cổng mạng ảo để Railway không kill bot
const port = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.write("Bot nhac SAI dang quay rat gat!");
  res.end();
}).listen(port);

const PREFIX = '!';

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // Lệnh chọn nhạc theo tên hoặc link: !play [tên bài hát]
  if (command === 'play') {
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.reply('Vào phòng voice trước đi ông nội!');

    const searchQuery = args.join(' ');
    if (!searchQuery) return message.reply('Gõ tên bài hát hoặc dán cái link YouTube vào đê!');

    try {
      await message.channel.sendTyping();
      let videoUrl = searchQuery;

      // Nếu không phải link trực tiếp, tự động tìm kiếm trên YouTube
      if (!play.yt_validate(searchQuery)) {
        const searchResults = await play.search(searchQuery, { limit: 1 });
        if (searchResults.length === 0) {
          return message.reply('Đéo tìm thấy bài này trên YouTube luôn, gõ từ khác đi.');
        }
        videoUrl = searchResults[0].url;
        message.channel.send(`🔍 Đã tìm thấy: **${searchResults[0].title}**`);
      }

      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: message.guild.id,
        adapterCreator: message.guild.voiceAdapterCreator,
      });

      // Tạo stream nhạc chất lượng cao
      const stream = await play.stream(videoUrl, { quality: 2 });
      const resource = createAudioResource(stream.stream, { inputType: stream.type });
      
      const player = createAudioPlayer({
        behaviors: { noSubscriber: NoSubscriberBehavior.Play }
      });
      
      player.play(resource);
      connection.subscribe(player);

      message.reply(`🎵 Đang phát nhạc rồi nhé anh em cày cuốc!`);

      player.on(AudioPlayerStatus.Idle, () => {
        connection.destroy();
      });

      player.on('error', error => {
        console.error(error);
        message.reply('Hic, luồng âm thanh bị lỗi rồi!');
      });

    } catch (error) {
      console.error(error);
      message.reply('Lỗi rồi, khả năng cao server đang bị YouTube chặn IP.');
    }
  }

  // Lệnh dừng nhạc out phòng: !stop
  if (command === 'stop') {
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.reply('Vào phòng voice mới bắt tớ tắt nhạc được chứ.');
    
    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: message.guild.id,
      adapterCreator: message.guild.voiceAdapterCreator,
    });
    
    if (connection) {
      connection.destroy();
      message.reply('Tắt nhạc! Rời phòng voice liền đây.');
    }
  }
});

client.once('ready', () => {
  console.log(`[ONLINE] Bot Nhạc SAI xịn sò đã sẵn sàng!`);
});

// Chống crash sập nguồn nếu chưa cài biến môi trường
if (!process.env.DISCORD_TOKEN_MUSIC) {
  console.log("Cảnh báo: Chưa thèm add biến DISCORD_TOKEN_MUSIC vào tab Variables kìa!");
} else {
  client.login(process.env.DISCORD_TOKEN_MUSIC).catch(err => console.error("Lỗi Token rồi: ", err));
}
