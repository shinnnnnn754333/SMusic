const { Client, GatewayIntentBits } = require('discord.js');
const { Manager } = require('magmastream');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.MessageContent]
});

// Bản danh sách trạm dự phòng "trâu bò" nhất
const nodes = [
    { host: "lava.link", port: 80, password: "youshallnotpass", secure: false },
    { host: "lavalink.oops.pufferfish.host", port: 443, password: "youshallnotpass", secure: true },
    { host: "lavalink.lexi.pw", port: 443, password: "youshallnotpass", secure: true }
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

client.manager.on("nodeConnect", node => console.log(`✅ Kết nối thành công: ${node.options.host}`));
client.manager.on("nodeError", (node, error) => console.log(`❌ Lỗi Node ${node.options.host}: ${error.message}`));

client.on('messageCreate', async message => {
    if (message.author.bot || !message.content.startsWith('!play')) return;

    const args = message.content.split(' ');
    const query = args.slice(1).join(' ');
    if (!query) return message.reply('Nhập tên bài hát đi mày!');

    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.reply('Vô phòng voice trước đi!');

    const player = client.manager.create({
        guildId: message.guild.id,
        voiceChannel: voiceChannel.id,
        textChannel: message.channel.id,
    });

    if (player.state !== "CONNECTED") player.connect();
    
    const res = await client.manager.search(query, message.author);
    if (res.loadType === "empty") return message.reply('Không tìm thấy bài!');
    
    player.queue.add(res.tracks[0]);
    message.reply(`Đang phát: ${res.tracks[0].title}`);
    if (!player.playing) player.play();
});

client.on("raw", (d) => client.manager.updateVoiceState(d));
client.login(process.env.DISCORD_TOKEN);
                                                     
