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

// Tạo mạng ảo giữ bot sống
const port = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.write("Bot nhac SAI VIP dang chay!");
  res.end();
}).listen(port);

const PREFIX = '!';

// Lấy vé VIP (Client ID) của SoundCloud tự động để khỏi bị đá
play.getFreeClientID().then((clientID) => {
  play.setToken({
    soundcloud: {
      client_id: clientID
    }
  });
  console.log("[VIP] Đã chôm được vé SoundCloud: " + clientID);
}).catch((err) => console.log("Lỗi chôm vé: ", err));

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // Lệnh tự kiếm nhạc SoundCloud: !play [tên bài hát]
  if (command === 'play') {
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.reply('Vào phòng voice đi mạy, định cho ma nghe à!');

    const searchQuery = args.join(' ');
    if (!searchQuery) return message.reply('Gõ tên bài hát ra tớ mới kiếm được chứ!');

    try {
      await message.channel.sendTyping();
      
      const searchResults = await play.search(searchQuery, { 
        source: { soundcloud: 'tracks' }, 
        limit: 1 
      });

      if (searchResults.length === 0) {
        return message.reply('Đéo tìm thấy bài này trên SoundCloud, thử gõ tên khác đi.');
      }

      const track = searchResults[0];
      message.channel.send(`☁️ Tìm thấy trên SoundCloud: **${track.name}**`);

      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: message.guild.id,
        adapterCreator: message.guild.voiceAdapterCreator,
      });

      const stream = await play.stream(track.url);
      const resource = createAudioResource(stream.stream, { inputType: stream.type });
      
      const player = createAudioPlayer({
        behaviors: { noSubscriber: NoSubscriberBehavior.Play }
      });
      
      player.play(resource);
      connection.subscribe(player);

      player.on(AudioPlayerStatus.Idle, () => {
        connection.destroy();
      });

      player.on('error', error => {
        console.error(error);
        message.reply('Má, luồng âm thanh bị lỗi mẹ rồi!');
      });

    } catch (error) {
      console.error(error);
      message.reply('Lỗi mẹ rồi, nãy chôm vé SoundCloud hụt cmnr!');
    }
  }

  // Lệnh out phòng: !stop
  if (command === 'stop') {
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.reply('Mày vào phòng đi rồi tao mới tắt nhạc được.');
    
    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: message.guild.id,
      adapterCreator: message.guild.voiceAdapterCreator,
    });
    
    if (connection) {
      connection.destroy();
      message.reply('Tắt nhạc! Rút quân đây.');
    }
  }
});

client.once('ready', () => {
  console.log(`[ONLINE] Bot Nhạc đã tái sinh!`);
});

client.login(process.env.DISCORD_TOKEN_MUSIC);
        
