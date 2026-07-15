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

// Trạm phát nhạc Lavalink đã được cập nhật mới, ổn định const nodes = [
const nodes = [
    {
        host: "lavalink.oops.pufferfish.host",
        port: 443,
        password: "youshallnotpass",
        secure: true
    }
];

client.manager = new Manager({
    nodes: nodes,
    playNextOnEnd: true,
    send: (id, payload) => {
        const guild = client.guilds.cache.get(id);
        if (guild) guild.shard.send(payload);
    }
});

client.on('ready', () => {
    console.log(`✅ Bot Chán O đã lên sóng!`);
    client.manager.init(client.user.id);
});

client.manager.on("nodeConnect", node => console.log(`✅ Đã kết nối Lavalink: ${node.options.host}`));
client.manager.on("nodeError", (node, error) => console.log(`❌ Lỗi Node Lavalink: ${error.message}`));

client.on('messageCreate', async message => {
    if (message.author.bot || !message.content.startsWith('!play')) return;
    
    console.log("👉 Nhận được lệnh !play");

    const args = message.content.split(' ');
    const query = args.slice(1).join(' ');
    if (!query) return message.reply('Ê, nhập tên bài hát vô chứ mày!');

    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.reply('Vào phòng thoại trước đi nha');

    console.log("👉 Đang tạo player...");
    const player = client.manager.create({
        guildId: message.guild.id,
        voiceChannel: voiceChannel.id,
        textChannel: message.channel.id,
    });

    if (player.state !== "CONNECTED") {
        console.log("👉 Đang thử chui vào phòng...");
        player.connect();
    }
    
    const res = await client.manager.search(query, message.author);
    if (res.loadType === "empty") return message.reply('Không tìm thấy bài!');
    
    player.queue.add(res.tracks[0]);
    message.reply(`Đang phát: ${res.tracks[0].title}`);
    if (!player.playing) player.play();
});

client.on("raw", (d) => client.manager.updateVoiceState(d));
client.login(process.env.DISCORD_TOKEN);
