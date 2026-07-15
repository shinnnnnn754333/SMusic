const { Client, GatewayIntentBits } = require('discord.js');
const { Manager } = require('magmastream');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent
    ]
});

// Trạm phát nhạc trung gian (Lavalink public sạch, né YouTube chặn)
const nodes = [
    {
        host: "lava.link",        
        port: 80,                 
        password: "youshallnotpass", 
        secure: false
    }
];

client.manager = new Manager({
    nodes: nodes,
    playNextOnEnd: true
    send: (id, payload) => {
        const guild = client.guilds.cache.get(id);
        if (guild) guild.shard.send(payload);
    }
});

client.manager.on("nodeConnect", node => console.log(`✅ Kết nối thành công Lavalink: ${node.options.host}`));
client.manager.on("nodeError", (node, error) => console.log(`❌ Lỗi Lavalink: ${error.message}`));

client.manager.on("trackStart", (player, track) => {
    const channel = client.channels.cache.get(player.textChannel);
    channel.send(`🎶 Đang quẩy bài: **${track.title}**`);
});

client.manager.on("queueEnd", player => {
    const channel = client.channels.cache.get(player.textChannel);
    channel.send("Hết nhạc rồi, tao lượn đây!");
    player.destroy(); 
});

client.once('ready', () => {
    console.log(`✅ Bot ${client.user.tag} đã lên sóng!`);
    client.manager.init(client.user.id); 
});

client.on("raw", (d) => client.manager.updateVoiceState(d));

client.on('messageCreate', async message => {
    if (message.author.bot || !message.inGuild()) return;

    if (message.content.startsWith('!play')) {
        const args = message.content.split(' ');
        const query = args.slice(1).join(' ');

        if (!query) return message.reply('Ê, nhập tên bài hát vô chứ mày!');
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) return message.reply('Vào phòng thoại trước đi bé Shin!');

        const player = client.manager.create({
            guild: message.guild.id,
            voiceChannel: voiceChannel.id,
            textChannel: message.channel.id,
        });

        if (player.state !== "CONNECTED") player.connect();

        const res = await client.manager.search(query, message.author);
        
        if (res.loadType === "empty") return message.reply('Không tìm thấy bài này!');
        if (res.loadType === "error") return message.reply('Lỗi rồi, thử bài khác đi!');

        if (res.loadType === "playlist") {
            player.queue.add(res.tracks);
            message.reply(`Đã gom cả playlist **${res.playlist.name}** vào danh sách.`);
            if (!player.playing && !player.paused && player.queue.totalSize === res.tracks.length) player.play();
        } else {
            player.queue.add(res.tracks[0]);
            message.reply(`Đã chốt đơn bài **${res.tracks[0].title}** vào hàng chờ.`);
            if (!player.playing && !player.paused && !player.queue.size) player.play();
        }
    }

    if (message.content === '!skip') {
        const player = client.manager.players.get(message.guild.id);
        if (!player) return message.reply("Có bài nào đang phát đâu!");
        player.stop(); 
        message.reply("Đã next!");
    }

    if (message.content === '!stop') {
        const player = client.manager.players.get(message.guild.id);
        if (!player) return message.reply("Đang im re mà tắt gì!");
        player.destroy(); 
        message.reply("Đã tắt nhạc và sủi!");
    }
});

// Đọc Token từ biến môi trường cực kỳ an toàn
client.login(process.env.DISCORD_TOKEN);
