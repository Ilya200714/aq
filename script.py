const prefix = "mega-vchat-";
let peer, myStream, dataConnections = [];
let currentUser = { nick: localStorage.getItem('nick') || '' };

// Вход и профиль
document.getElementById('save-profile-btn').onclick = () => {
    const nick = document.getElementById('user-nickname').value;
    if (!nick) return alert("Введите ник!");
    currentUser.nick = nick;
    localStorage.setItem('nick', nick);
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('setup-screen').style.display = 'flex';
    document.getElementById('welcome-msg').innerText = `Привет, ${nick}!`;
};

// Подключение к комнате
document.getElementById('join-btn').onclick = async () => {
    const room = document.getElementById('room-id').value;
    myStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    myStream.getVideoTracks()[0].enabled = false; // Камера выкл сразу
    
    peer = new Peer(prefix + room);
    
    peer.on('open', (id) => {
        startSession(room);
        addCard(currentUser.nick, myStream, true, 'me');
    });

    peer.on('call', call => {
        call.answer(myStream);
        call.on('stream', remoteStream => addCard(call.metadata.nick, remoteStream, false, call.peer));
    });

    peer.on('connection', conn => setupData(conn));
};

function startSession(room) {
    document.getElementById('setup-screen').style.display = 'none';
    document.getElementById('chat-screen').style.display = 'block';
    document.getElementById('room-name-display').innerText = room;
}

// Функции для карточек участников
function addCard(nick, stream, isMe, id) {
    if (document.getElementById('card-'+id)) return;
    const grid = document.getElementById('user-grid');
    const card = document.createElement('div');
    card.id = 'card-'+id;
    card.className = 'avatar-card';
    card.innerHTML = `<span>${nick}</span>`;

    const video = document.createElement('video');
    video.srcObject = stream;
    video.autoplay = true;
    video.muted = isMe;
    video.id = 'v-'+id;
    card.appendChild(video);

    if (!isMe) {
        const slider = document.createElement('input');
        slider.type = 'range'; slider.className = 'vol-slider';
        slider.min = 0; slider.max = 1; slider.step = 0.1; slider.value = 1;
        slider.oninput = (e) => video.volume = e.target.value;
        card.appendChild(slider);
    }

    grid.appendChild(card);
}

// Рисовалка P2P
function initCanvas() {
    const canvas = document.getElementById('shared-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight;
    let drawing = false;

    canvas.onmousedown = () => drawing = true;
    canvas.onmouseup = () => drawing = false;
    canvas.onmousemove = (e) => {
        if (!drawing) return;
        const x = e.offsetX; const y = e.offsetY;
        const color = document.getElementById('line-color').value;
        draw(x, y, color);
        dataConnections.forEach(c => c.send({type: 'draw', x, y, color}));
    };
}

function draw(x, y, color) {
    const ctx = document.getElementById('shared-canvas').getContext('2d');
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI*2); ctx.fill();
}

// Настройки оборудования
document.getElementById('settings-btn').onclick = async () => {
    document.getElementById('settings-modal').style.display = 'flex';
    const devices = await navigator.mediaDevices.enumerateDevices();
    const micSelect = document.getElementById('mic-select');
    micSelect.innerHTML = devices.filter(d => d.kind === 'audioinput')
        .map(d => `<option value="${d.deviceId}">${d.label}</option>`).join('');
};

function closeSettings() { document.getElementById('settings-modal').style.display = 'none'; }
