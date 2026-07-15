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
  res.write("Bot nhac SAI SoundCloud dang chay muot ma!");
  res.end();
}).listen(port);

const PREFIX = '!';

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // Lệnh tự kiếm và phát nhạc từ SoundCloud: !play [Tên bài hát]
  if (command === 'play') {
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.reply('Vào phòng voice trước đi ông nội!');

    const searchQuery = args.join(' ');
    if (!searchQuery) return message.reply('Gõ tên bài hát tớ mới tìm được chứ!');

    try {
      await message.channel.sendTyping();
      
      // Lệnh lách luật: Tự động lên SoundCloud tìm bài đầu tiên
      const searchResults = await play.search(searchQuery, { 
        source: { soundcloud: 'tracks' }, 
        limit: 1 
      });

      if (searchResults.length === 0) {
        return message.reply('Đéo tìm thấy bài này trên SoundCloud luôn, gõ bài khác hoặc tên ca sĩ xem.');
      }

      const track = searchResults[0];
      message.channel.send(`☁️ Tìm thấy trên SoundCloud: **${track.name}**`);

      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: message.guild.id,
        adapterCreator: message.guild.voiceAdapterCreator,
      });

      // Lấy stream nhạc trực tiếp từ SoundCloud (Bao mượt, chống chặn IP)
      const stream = await play.stream(track.url);
      const resource = createAudioResource(stream.stream, { inputType: stream.type });
      
      const player = createAudioPlayer({
        behaviors: { noSubscriber: NoSubscriberBehavior.Play }
      });
      
      player.play(resource);
      connection.subscribe(player);

      message.reply(`▶️ Đang phát nhạc rồi nhé anh em cày cuốc!`);

      player.on(AudioPlayerStatus.Idle, () => {
        connection.destroy(); // Hết nhạc tự cút khỏi phòng
      });

      player.on('error', error => {
        console.error(error);
        message.reply('Hic, luồng âm thanh SoundCloud bị lỗi rồi!');
      });

    } catch (error) {
      console.error(error);
      message.reply('Lỗi rồi, không kết nối được tới server SoundCloud.');
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
  console.log(`[ONLINE] Bot Nhạc SoundCloud đã sẵn sàng!`);
});

client.login(process.env.DISCORD_TOKEN_MUSIC);
        
