const prefix = "mega-v-room-";
let peer, myStream, screenStream;
let dataConnections = {};
let currentUser = { nick: localStorage.getItem('nick') || '' };

// Вход
const saveBtn = document.getElementById('save-profile-btn');
if (saveBtn) {
    saveBtn.onclick = () => {
        const nick = document.getElementById('user-nickname').value;
        if (!nick) return alert("Введите ник!");
        currentUser.nick = nick;
        localStorage.setItem('nick', nick);
        document.getElementById('auth-screen').style.display = 'none';
        document.getElementById('setup-screen').style.display = 'flex';
        document.getElementById('welcome-msg').innerText = `Привет, ${nick}!`;
    };
}

// Подключение
document.getElementById('join-btn').onclick = async () => {
    const room = document.getElementById('room-id').value;
    if (!room) return alert("Введите ID комнаты");

    try {
        myStream = await navigator.mediaDevices.getUserMedia({ 
            audio: { echoCancellation: true, noiseSuppression: true }, 
            video: true 
        });
        myStream.getVideoTracks()[0].enabled = false;

        // Генерация случайного ID, чтобы избежать конфликтов PeerJS
        const myPeerId = prefix + room + "-" + Math.random().toString(36).substr(2, 5);
        peer = new Peer(myPeerId, {
            config: {'iceServers': [{ url: 'stun:stun.l.google.com:19302' }]}
        });

        peer.on('open', (id) => {
            startSession(room);
            addCard(currentUser.nick, myStream, true, id);
        });

        peer.on('call', call => {
            call.answer(myStream);
            call.on('stream', remoteStream => addCard(call.metadata?.nick || "Друг", remoteStream, false, call.peer));
        });

        peer.on('connection', conn => setupData(conn));
    } catch (e) { alert("Ошибка доступа: " + e.message); }
};

function startSession(room) {
    document.getElementById('setup-screen').style.display = 'none';
    document.getElementById('chat-screen').style.display = 'block';
    document.getElementById('room-name-display').innerText = room;
}

function addCard(nick, stream, isMe, id) {
    if (document.getElementById('card-'+id)) return;
    const grid = document.getElementById('user-grid');
    const card = document.createElement('div');
    card.id = 'card-'+id;
    card.className = 'avatar-card';
    card.innerHTML = `<div style="position:absolute;top:5px;left:5px;background:rgba(0,0,0,0.5);padding:2px 5px;font-size:12px;">${nick}</div>`;

    const video = document.createElement('video');
    video.srcObject = stream;
    video.autoplay = true;
    video.muted = isMe;
    video.id = 'v-'+id;
    card.appendChild(video);
    grid.appendChild(card);
}

// Безопасное назначение кнопок (исправляет твою ошибку)
const sendBtn = document.getElementById('send-msg-btn');
if (sendBtn) {
    sendBtn.onclick = () => {
        const input = document.getElementById('chat-input');
        if (!input.value) return;
        const data = { type: 'chat', text: input.value, nick: currentUser.nick };
        Object.values(dataConnections).forEach(c => c.send(data));
        appendMessage(data, true);
        input.value = "";
    };
}

const screenBtn = document.getElementById('screen-btn');
if (screenBtn) {
    screenBtn.onclick = async () => {
        try {
            screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
            document.getElementById('v-' + peer.id).srcObject = screenStream;
        } catch (e) { console.log("Стрим отменен"); }
    };
}

function setupData(conn) {
    dataConnections[conn.peer] = conn;
    conn.on('data', data => {
        if (data.type === 'chat') appendMessage(data, false);
    });
}

function appendMessage(data, isMe) {
    const chat = document.getElementById('chat-messages');
    const msg = document.createElement('div');
    msg.style.margin = "5px 0";
    msg.style.textAlign = isMe ? "right" : "left";
    msg.innerHTML = `<span style="background:${isMe?'#3d5afe':'#333'};padding:5px 10px;border-radius:10px;">${data.text}</span>`;
    chat.appendChild(msg);
    chat.scrollTop = chat.scrollHeight;
}

function toggleMic() {
    const t = myStream.getAudioTracks()[0];
    t.enabled = !t.enabled;
}

function toggleCam() {
    const t = myStream.getVideoTracks()[0];
    t.enabled = !t.enabled;
}
