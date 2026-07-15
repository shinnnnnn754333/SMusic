const { Client, GatewayIntentBits } = require('discord.js');
const { Manager } = require('magmastream');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.MessageContent]
});

// Thử Node Lavalink mới nhất, con hàng này khá ổn định
const nodes = [{
    host: "lava.link", 
    port: 80,
    password: "youshallnotpass",
    secure: false
}];

client.manager = new Manager({
    nodes: nodes,
    playNextOnEnd: true,
    send: (id, payload) => {
        const guild = client.guilds.cache.get(id);
        if (guild) guild.shard.send(payload);
    }
});

client.on('ready', () => {
    console.log(`✅ Bot đã lên sóng: ${client.user.tag}`);
    client.manager.init(client.user.id);
});

client.manager.on("nodeConnect", node => console.log(`✅ Đã kết nối Lavalink: ${node.options.host}`));
client.manager.on("nodeError", (node, error) => console.log(`❌ Lỗi Node Lavalink: ${error.message}`));

client.on('messageCreate', async message => {
    if (message.author.bot || !message.content.startsWith('!play')) return;
    
    console.log("👉 Nhận được lệnh !play"); // DEBUG: Xem nó có nhận lệnh không

    const args = message.content.split(' ');
    const query = args.slice(1).join(' ');
    if (!query) return message.reply('Ê, nhập tên bài hát vô!');

    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.reply('Vào phòng thoại trước đi bé Shin!');

    console.log("👉 Đang tạo player..."); // DEBUG: Xem nó chạy đến đoạn này chưa
    const player = client.manager.create({
        guildId: message.guild.id,
        voiceChannel: voiceChannel.id,
        textChannel: message.channel.id,
    });

    if (player.state !== "CONNECTED") {
        console.log("👉 Đang thử chui vào phòng..."); // DEBUG
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
