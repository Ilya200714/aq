const prefix = "mega-v-";
let peer, myStream;
let dataConnections = {};
let currentUser = { nick: localStorage.getItem('nick') || 'Друг' };

// Вспомогательная функция для безопасного поиска элементов
const $ = (id) => document.getElementById(id);

// 1. ПЕРЕХОД ИЗ ВХОДА В ЛОББИ
if ($('save-profile-btn')) {
    $('save-profile-btn').onclick = () => {
        const nick = $('user-nickname').value;
        if (!nick) return alert("Введите ник!");
        currentUser.nick = nick;
        localStorage.setItem('nick', nick);
        $('auth-screen').style.display = 'none';
        $('setup-screen').style.display = 'flex';
        $('welcome-msg').innerText = `Привет, ${nick}!`;
    };
}

// 2. ИНИЦИАЛИЗАЦИЯ КАМЕРЫ И МИКРОФОНА
async function startMedia() {
    try {
        myStream = await navigator.mediaDevices.getUserMedia({ 
            audio: { echoCancellation: true, noiseSuppression: true }, 
            video: true 
        });
        // По умолчанию камера выключена, только микрофон
        myStream.getVideoTracks()[0].enabled = false;
        return true;
    } catch (e) {
        alert("Ошибка доступа к микрофону/камере. Проверь разрешения в браузере!");
        return false;
    }
}

// 3. ЛОГИКА СОЗДАНИЯ И ПРИСОЕДИНЕНИЯ
const initPeer = (myId, isHost, roomName) => {
    peer = new Peer(myId, {
        config: {'iceServers': [{ url: 'stun:stun.l.google.com:19302' }]}
    });

    peer.on('open', (id) => {
        console.log("Мой ID в сети:", id);
        $('setup-screen').style.display = 'none';
        $('chat-screen').style.display = 'block';
        $('room-name-display').innerText = "Комната: " + roomName;
        addCard(currentUser.nick, myStream, true, id);

        if (!isHost) {
            // Если мы гость — подключаемся к хосту (создателю)
            const hostId = prefix + roomName;
            const call = peer.call(hostId, myStream, {metadata: {nick: currentUser.nick}});
            call.on('stream', remoteStream => addCard("Создатель", remoteStream, false, hostId));
            setupData(peer.connect(hostId));
        }
    });

    peer.on('call', call => {
        call.answer(myStream);
        call.on('stream', stream => addCard(call.metadata?.nick || "Друг", stream, false, call.peer));
    });

    peer.on('connection', conn => setupData(conn));
    
    peer.on('error', err => {
        console.error("Ошибка PeerJS:", err);
        if (err.type === 'unavailable-id') alert("Эта комната уже занята или создана!");
    });
};

if ($('create-btn')) {
    $('create-btn').onclick = async () => {
        const room = $('room-id').value;
        if (!room) return alert("Введите ID комнаты!");
        if (await startMedia()) initPeer(prefix + room, true, room);
    };
}

if ($('join-btn')) {
    $('join-btn').onclick = async () => {
        const room = $('room-id').value;
        if (!room) return alert("Введите ID комнаты!");
        if (await startMedia()) {
            const randomId = prefix + room + "-" + Math.random().toString(36).substr(2, 5);
            initPeer(randomId, false, room);
        }
    };
}

// 4. ФУНКЦИИ ИНТЕРФЕЙСА
function addCard(nick, stream, isMe, id) {
    if ($('card-'+id)) return;
    const grid = $('user-grid');
    const card = document.createElement('div');
    card.id = 'card-'+id;
    card.className = 'avatar-card';
    card.style.background = "#1a1a1a";
    card.style.borderRadius = "15px";
    card.style.overflow = "hidden";
    card.style.position = "relative";
    card.innerHTML = `<div style="position:absolute;top:10px;left:10px;z-index:10;background:rgba(0,0,0,0.5);padding:2px 10px;border-radius:5px;">${nick}</div>`;

    const video = document.createElement('video');
    video.srcObject = stream;
    video.autoplay = true;
    video.muted = isMe;
    video.style.width = "100%";
    video.style.height = "100%";
    video.style.objectFit = "cover";

    card.appendChild(video);
    grid.appendChild(card);
}

function setupData(conn) {
    dataConnections[conn.peer] = conn;
    conn.on('data', data => {
        if (data.type === 'chat') appendMessage(data, false);
    });
}

function appendMessage(data, isMe) {
    const msgArea = $('chat-messages');
    const div = document.createElement('div');
    div.style.textAlign = isMe ? 'right' : 'left';
    div.innerHTML = `<p style="display:inline-block;background:${isMe?'#3d5afe':'#444'};padding:8px 12px;border-radius:10px;margin:5px;">${isMe?'':data.nick+': '}${data.text}</p>`;
    msgArea.appendChild(div);
    msgArea.scrollTop = msgArea.scrollHeight;
}

if ($('send-msg-btn')) {
    $('send-msg-btn').onclick = () => {
        const val = $('chat-input').value;
        if (!val) return;
        const data = { type: 'chat', text: val, nick: currentUser.nick };
        Object.values(dataConnections).forEach(c => c.send(data));
        appendMessage(data, true);
        $('chat-input').value = "";
    };
}

// Управление микрофоном и камерой
if ($('mic-btn')) {
    $('mic-btn').onclick = () => {
        const audio = myStream.getAudioTracks()[0];
        audio.enabled = !audio.enabled;
        $('mic-btn').innerText = audio.enabled ? '🎤' : '🔇';
    };
}

if ($('cam-btn')) {
    $('cam-btn').onclick = () => {
        const video = myStream.getVideoTracks()[0];
        video.enabled = !video.enabled;
        $('cam-btn').innerText = video.enabled ? '📷' : '❌';
    };
}
