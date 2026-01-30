const prefix = "mega-p2p-room-";
let peer, myStream, screenStream;
let dataConnections = {};
let currentUser = { nick: localStorage.getItem('nick') || '' };

// 1. ВХОД В ПРОФИЛЬ
document.getElementById('save-profile-btn').onclick = () => {
    const nick = document.getElementById('user-nickname').value;
    if (!nick) return alert("Введите имя!");
    currentUser.nick = nick;
    localStorage.setItem('nick', nick);
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('setup-screen').style.display = 'flex';
    document.getElementById('welcome-msg').innerText = `Привет, ${nick}!`;
};

// 2. ПОДКЛЮЧЕНИЕ И ЗАПУСК WEBRTC
document.getElementById('join-btn').onclick = async () => {
    const room = document.getElementById('room-id').value;
    if (!room) return alert("Введите ID комнаты");

    try {
        // Шумоподавление включено в настройках аудио
        myStream = await navigator.mediaDevices.getUserMedia({ 
            audio: { echoCancellation: true, noiseSuppression: true }, 
            video: true 
        });
        myStream.getVideoTracks()[0].enabled = false; // Видео выключено при входе

        // Инициализация PeerJS (используем бесплатные STUN Google для обхода NAT)
        peer = new Peer(prefix + room + "-" + Math.random().toString(36).substr(2, 5), {
            config: {'iceServers': [{ url: 'stun:stun.l.google.com:19302' }]}
        });

        peer.on('open', (id) => {
            console.log("Мой ID:", id);
            startSession(room);
            addCard(currentUser.nick, myStream, true, id);
            // Тут в реальном приложении нужен список участников от сервера, 
            // в упрощенном P2P — автоматическое сканирование или прямой ввод.
        });

        // Входящий звонок (аудио/видео)
        peer.on('call', call => {
            call.answer(myStream);
            call.on('stream', remoteStream => addCard(call.metadata.nick, remoteStream, false, call.peer));
        });

        // Входящее соединение (чат/данные)
        peer.on('connection', conn => setupData(conn));

    } catch (e) { alert("Ошибка доступа к камере/микрофону"); }
};

function startSession(room) {
    document.getElementById('setup-screen').style.display = 'none';
    document.getElementById('chat-screen').style.display = 'block';
    document.getElementById('room-name-display').innerText = "Комната: " + room;
}

// 3. УПРАВЛЕНИЕ КАРТОЧКАМИ И СЕТКОЙ
function addCard(nick, stream, isMe, id) {
    if (document.getElementById('card-'+id)) return;
    const grid = document.getElementById('user-grid');
    const card = document.createElement('div');
    card.id = 'card-'+id;
    card.className = 'avatar-card';
    card.innerHTML = `<div class="nick-tag">${nick}</div>`;

    const video = document.createElement('video');
    video.srcObject = stream;
    video.autoplay = true;
    video.muted = isMe;
    video.id = 'v-'+id;
    card.appendChild(video);

    grid.appendChild(card);
    if (isMe) monitorVolume(stream, card.id);
}

// 4. ДЕМОНСТРАЦИЯ ЭКРАНА
document.getElementById('screen-btn').onclick = async () => {
    try {
        screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];
        
        // Меняем трек во всех активных звонках
        Object.values(peer.connections).forEach(conns => {
            conns.forEach(c => {
                if (c.type === 'media') {
                    const sender = c.peerConnection.getSenders().find(s => s.track.kind === 'video');
                    sender.replaceTrack(screenTrack);
                }
            });
        });

        document.getElementById('v-me').srcObject = screenStream;
        screenTrack.onended = () => { /* Вернуть камеру */ };
    } catch (err) { console.log(err); }
};

// 5. ЛОГИКА ЧАТА И ЭМОДЗИ
function setupData(conn) {
    dataConnections[conn.peer] = conn;
    conn.on('data', data => {
        if (data.type === 'chat') appendMessage(data, false);
        if (data.type === 'emoji') showFlyingEmoji(data.emoji);
    });
}

function appendMessage(data, isMe) {
    const chat = document.getElementById('chat-messages');
    const msg = document.createElement('div');
    msg.className = `message-bubble ${isMe ? 'me' : ''}`;
    msg.innerText = `${isMe ? '' : data.nick + ': '}${data.text}`;
    chat.appendChild(msg);
    chat.scrollTop = chat.scrollHeight;
}

document.getElementById('send-msg-btn').onclick = () => {
    const input = document.getElementById('chat-input');
    const text = input.value;
    if (!text) return;
    
    const data = { type: 'chat', text, nick: currentUser.nick };
    Object.values(dataConnections).forEach(c => c.send(data));
    appendMessage(data, true);
    input.value = "";
};

// Вспомогательные функции
function toggleMic() {
    const t = myStream.getAudioTracks()[0];
    t.enabled = !t.enabled;
    document.getElementById('mic-btn').innerText = t.enabled ? '🎤' : '🔇';
}

function toggleCam() {
    const t = myStream.getVideoTracks()[0];
    t.enabled = !t.enabled;
    document.getElementById('cam-btn').innerText = t.enabled ? '📷' : '❌';
}

function sendEmoji(emoji) {
    Object.values(dataConnections).forEach(c => c.send({type: 'emoji', emoji}));
    showFlyingEmoji(emoji);
}

function showFlyingEmoji(emoji) {
    const el = document.createElement('div');
    el.innerText = emoji;
    el.style = `position:fixed; bottom:20px; left:${Math.random()*80}%; font-size:3rem; transition: 2s; z-index:100;`;
    document.body.appendChild(el);
    setTimeout(() => { el.style.transform = 'translateY(-600px)'; el.style.opacity = '0'; }, 50);
    setTimeout(() => el.remove(), 2000);
}

// Индикатор громкости (VAD)
function monitorVolume(stream, cardId) {
    const ctx = new AudioContext();
    const src = ctx.createMediaStreamSource(stream);
    const ans = ctx.createAnalyser();
    src.connect(ans);
    const data = new Uint8Array(ans.frequencyBinCount);
    function check() {
        ans.getByteFrequencyData(data);
        const vol = data.reduce((a, b) => a + b) / data.length;
        document.getElementById(cardId).style.borderColor = vol > 35 ? 'var(--primary)' : 'transparent';
        requestAnimationFrame(check);
    }
    check();
}
