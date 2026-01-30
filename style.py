:root {
    --bg: #0f0f13;
    --card: #1c1c24;
    --accent: #3d5afe;
    --text: #ffffff;
}

body {
    background: var(--bg);
    color: var(--text);
    font-family: 'Segoe UI', sans-serif;
    margin: 0;
    overflow: hidden;
}

#app { display: flex; height: 100vh; justify-content: center; align-items: center; }

/* Сетка аватаров */
.grid {
    display: flex;
    gap: 15px;
    flex-wrap: wrap;
    padding: 20px;
    overflow-y: auto;
}

.avatar-card {
    background: var(--card);
    width: 140px;
    height: 180px;
    border-radius: 15px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
    transition: 0.3s;
}

.pic {
    width: 70px;
    height: 70px;
    background: #333;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 30px;
    margin-bottom: 10px;
    border: 3px solid transparent;
}

video { width: 100%; height: 100%; position: absolute; top: 0; border-radius: 15px; object-fit: cover; opacity: 0.1; pointer-events: none; }

/* Чат */
.main-layout { display: flex; width: 95vw; height: 80vh; gap: 20px; }
.left-panel { flex: 2; display: flex; flex-direction: column; }
.chat-panel { flex: 1; background: var(--card); border-radius: 15px; display: flex; flex-direction: column; padding: 15px; }
#chat-messages { flex: 1; overflow-y: auto; font-size: 14px; }

/* Кнопки */
.controls {
    position: fixed;
    bottom: 20px;
    display: flex;
    gap: 15px;
    background: rgba(0,0,0,0.5);
    padding: 10px 30px;
    border-radius: 50px;
    backdrop-filter: blur(10px);
}

button {
    background: var(--accent);
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: bold;
}

#canvas-container { background: #000; height: 150px; border-radius: 10px; position: relative; }
canvas { width: 100%; height: 100%; cursor: crosshair; }

.mic-test-container { width: 100%; height: 6px; background: #333; margin-top: 5px; }
#mic-test-bar { height: 100%; width: 0; background: #4caf50; transition: 0.1s; }
