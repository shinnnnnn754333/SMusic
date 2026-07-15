const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, NoSubscriberBehavior, VoiceConnectionStatus } = require('@discordjs/voice');
const play = require('play-dl');
const http = require('http');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildVoiceStates]
});

const port = process.env.PORT || 3000;
http.createServer((req, res) => res.end("Bot SAI Alive!")).listen(port);

const PREFIX = '!';

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === 'play') {
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.reply('Vào phòng voice đi mạy!');

    const searchQuery = args.join(' ');
    try {
      await message.channel.sendTyping();
      const results = await play.search(searchQuery, { source: { soundcloud: 'tracks' }, limit: 1 });
      if (results.length === 0) return message.reply('Không tìm thấy bài hát.');

      const track = results[0];
      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: message.guild.id,
        adapterCreator: message.guild.voiceAdapterCreator,
      });

      // Ép bot chờ kết nối xong mới phát
      connection.on(VoiceConnectionStatus.Ready, async () => {
        const stream = await play.stream(track.url);
        const resource = createAudioResource(stream.stream, { inputType: stream.type });
        const player = createAudioPlayer({ behaviors: { noSubscriber: NoSubscriberBehavior.Play } });
        
        player.play(resource);
        connection.subscribe(player);
        message.channel.send(`🎵 Đang phát: **${track.name}** - Nghe kỹ xem có tiếng chưa!`);

        player.on('error', err => {
            console.error(err);
            message.channel.send('Lỗi luồng âm thanh, bot bị câm rồi!');
        });
      });
    } catch (e) {
      message.reply('Bot vào được nhưng lỗi luồng âm thanh, check quyền voice đi!');
    }
  }

  if (command === 'stop') {
    const connection = joinVoiceChannel({ channelId: message.member.voice.channel?.id, guildId: message.guild.id, adapterCreator: message.guild.voiceAdapterCreator });
    connection.destroy();
    message.reply('Tắt nhạc!');
  }
});

client.login(process.env.DISCORD_TOKEN_MUSIC);
