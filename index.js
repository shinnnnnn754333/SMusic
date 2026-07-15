const { Client, GatewayIntentBits } = require('discord.js');
const { Manager } = require('magmastream');

// Khởi tạo Bot với các quyền cơ bản
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent
    ]
});

// Cấu hình trạm Lavalink (Mượn server người ta để cào nhạc)
const nodes = [
    {
        host: "lava.link",        // Địa chỉ trạm Lavalink công cộng
        port: 80,                 // Cổng mặc định
        password: "youshallnotpass", // Mật khẩu mặc định của trạm này
        secure: false
    }
];

// Khởi tạo hệ thống quản lý Lavalink
client.manager = new Manager({
    nodes: nodes,
    send: (id, payload) => {
        const guild = client.guilds.cache.get(id);
        if (guild) guild.shard.send(payload);
    }
});

// -- CÁC SỰ KIỆN CỦA LAVALINK --
client.manager.on("nodeConnect", node => console.log(`✅ Đã kết nối thành công với trạm Lavalink: ${node.options.host}`));
client.manager.on("nodeError", (node, error) => console.log(`❌ Lỗi trạm Lavalink ${node.options.host}: ${error.message}`));

client.manager.on("trackStart", (player, track) => {
    const channel = client.channels.cache.get(player.textChannel);
    channel.send(`🎶 Đang quẩy bài: **${track.title}**`);
});

client.manager.on("queueEnd", player => {
    const channel = client.channels.cache.get(player.textChannel);
    channel.send("Hết nhạc rồi, tao lượn đây!");
    player.destroy(); // Hết nhạc thì tự động hủy player và out phòng
});

// -- KHỞI ĐỘNG BOT VÀ KẾT NỐI --
client.once('ready', () => {
    console.log(`✅ Bot ${client.user.tag} đã lên sóng!`);
    client.manager.init(client.user.id); // Khởi động Lavalink khi bot ready
});

// Gửi dữ liệu âm thanh của Discord qua cho Lavalink xử lý
client.on("raw", (d) => client.manager.updateVoiceState(d));

// -- BẮT LỆNH CHAT CỦA MÀY --
client.on('messageCreate', async message => {
    if (message.author.bot || !message.inGuild()) return;

    // Lệnh !play
    if (message.content.startsWith('!play')) {
        const args = message.content.split(' ');
        const query = args.slice(1).join(' ');

        if (!query) return message.reply('Ê, nhập tên bài hát vô chứ mày!');
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) return message.reply('Mày phải vào phòng thoại trước thì tao mới biết đường hầu!');

        // Tạo Trình phát (Player) cho server
        const player = client.manager.create({
            guild: message.guild.id,
            voiceChannel: voiceChannel.id,
            textChannel: message.channel.id,
        });

        // Nối vào phòng
        if (player.state !== "CONNECTED") player.connect();

        // Tìm nhạc qua trạm Lavalink
        const res = await client.manager.search(query, message.author);
        
        if (res.loadType === "empty") return message.reply('Không tìm thấy bài này!');
        if (res.loadType === "error") return message.reply('Lỗi cmnr, thử bài khác đi!');

        // Nhét nhạc vào hàng đợi
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

    // Lệnh !skip
    if (message.content === '!skip') {
        const player = client.manager.players.get(message.guild.id);
        if (!player) return message.reply("Có bài nào đang phát đâu mà qua!");
        player.stop(); // Stop sẽ tự động nhảy bài tiếp theo
        message.reply("Đã next!");
    }

    // Lệnh !stop
    if (message.content === '!stop') {
        const player = client.manager.players.get(message.guild.id);
        if (!player) return message.reply("Đang im re mà tắt gì!");
        player.destroy(); // Hủy kết nối
        message.reply("Đã tắt nhạc và sủi!");
    }
});

// NHỚ THAY TOKEN VÀO DÒNG DƯỚI NÀY
client.login');
