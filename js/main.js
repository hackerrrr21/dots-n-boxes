const AppState = {
    screen: 'setup-screen',
    gameConfig: {
        mode: 'cpu', // cpu, friend, host, join
        gridSize: 8,
        p1: { color: 'green', symbol: 'sun' },
        p2: { color: 'red', symbol: 'moon' }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    let progress = 0;
    const bar = document.getElementById('loading-bar');
    const interval = setInterval(() => {
        progress += Math.random() * 20;
        if(progress >= 100) {
            progress = 100;
            clearInterval(interval);
            setTimeout(() => {
                switchScreen('setup-screen');
                initSetupUI();
            }, 600);
        }
        if(bar) bar.style.width = `${progress}%`;
    }, 150);
});

function initSetupUI() {
    const modeBtns = document.querySelectorAll('#mode-options .opt-btn');
    const startBtn = document.getElementById('start-btn');
    const gridBtns = document.querySelectorAll('#grid-options .opt-btn');
    
    // Setup UI partitions
    const standardConfig = document.getElementById('standard-config');
    const p1Config = document.getElementById('p1-config');
    const p2Config = document.getElementById('p2-config');
    
    const hostWaitScreen = document.getElementById('host-wait-screen');
    const joinEnterScreen = document.getElementById('join-enter-screen');
    const joinConfigScreen = document.getElementById('join-config-screen');

    // UI State Management function
    const resetUIStates = () => {
        if(window.Network && window.Network.isConnected) window.Network.disconnect();
        standardConfig.classList.remove('hidden');
        p1Config.classList.remove('hidden');
        p2Config.classList.add('hidden');
        hostWaitScreen.classList.add('hidden');
        joinEnterScreen.classList.add('hidden');
        joinConfigScreen.classList.add('hidden');
        
        startBtn.style.display = 'block';
        startBtn.disabled = false;
        
        document.getElementById('setup-error').textContent = '';
    };

    modeBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            modeBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            AppState.gameConfig.mode = e.target.dataset.value;
            
            resetUIStates();

            if (AppState.gameConfig.mode === 'cpu') {
                startBtn.innerHTML = 'Start Game';
                document.getElementById('p1-title').textContent = 'Player 1';
            } 
            else if (AppState.gameConfig.mode === 'friend') {
                p2Config.classList.remove('hidden');
                startBtn.innerHTML = 'Start Game';
                document.getElementById('p1-title').textContent = 'Player 1';
            } 
            else if (AppState.gameConfig.mode === 'host') {
                startBtn.innerHTML = 'Host Game';
                document.getElementById('p1-title').textContent = 'You (Host)';
            } 
            else if (AppState.gameConfig.mode === 'join') {
                standardConfig.classList.add('hidden');
                joinEnterScreen.classList.remove('hidden');
                startBtn.style.display = 'none'; // Replaced by connect button internally
            }
        });
    });

    gridBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            gridBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            AppState.gameConfig.gridSize = parseInt(e.target.dataset.value);
        });
    });

    // Helper to bind color/symbol buttons
    const bindOptions = (containerId, stateTargetObj, type) => {
        const btns = document.querySelectorAll(`#${containerId} .${type}-btn`);
        btns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                if(e.target.classList.contains('disabled')) return;
                btns.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                stateTargetObj[type] = e.target.dataset.value;
                document.getElementById('setup-error').textContent = '';
            });
        });
    };

    bindOptions('p1-color', AppState.gameConfig.p1, 'color');
    bindOptions('p1-symbol', AppState.gameConfig.p1, 'symbol');
    bindOptions('p2-color', AppState.gameConfig.p2, 'color');
    bindOptions('p2-symbol', AppState.gameConfig.p2, 'symbol');
    bindOptions('join-p2-color', AppState.gameConfig.p2, 'color');
    bindOptions('join-p2-symbol', AppState.gameConfig.p2, 'symbol');

    // Central Start / Action button
    startBtn.addEventListener('click', () => {
        if(AppState.gameConfig.mode === 'host') {
            // First time click: Create room
            if(startBtn.innerHTML === 'Host Game') {
                standardConfig.classList.add('hidden');
                hostWaitScreen.classList.remove('hidden');
                
                document.getElementById('host-status').textContent = 'Connecting to server...';
                document.getElementById('host-status').style.color = 'var(--text-secondary)';
                startBtn.disabled = true;
                startBtn.innerHTML = 'Waiting for connection...';

                window.Network.initHost(
                    (id) => {
                        document.getElementById('room-code-display').textContent = id;
                        document.getElementById('host-status').textContent = 'Waiting for friend to connect...';
                        document.getElementById('host-status').style.color = 'var(--color-yellow)';
                    },
                    () => {
                        document.getElementById('host-status').textContent = 'Friend Connected! Waiting for them to choose config...';
                        document.getElementById('host-status').style.color = 'var(--color-yellow)';
                        // Send our config to Guest
                        window.Network.send({ type: 'config', config: AppState.gameConfig });
                    },
                    (data) => handleNetworkData(data)
                );
            } 
            // Second time: Start Game when friend is ready
            else if(startBtn.innerHTML === 'Start Remote Game') {
                window.Network.send({ type: 'start' });
                startGame();
            }
        } 
        else if (AppState.gameConfig.mode === 'join') {
            // Join Mode: Start Game acts as "Ready"
            if (AppState.gameConfig.p1.color === AppState.gameConfig.p2.color || AppState.gameConfig.p1.symbol === AppState.gameConfig.p2.symbol) {
                document.getElementById('setup-error').textContent = "You must select a different color and symbol than the Host.";
                return;
            }
            startBtn.disabled = true;
            startBtn.innerHTML = 'Waiting for Host to Start...';
            window.Network.send({ type: 'p2-config', p2: AppState.gameConfig.p2 });
        }
        else {
            if(validateSelection()) {
                startGame();
            }
        }
    });

    // Join Connect Button
    document.getElementById('join-btn').addEventListener('click', () => {
        const code = document.getElementById('join-code-input').value.trim();
        if(!code) return;
        
        document.getElementById('join-status').textContent = 'Connecting...';
        document.getElementById('join-status').style.color = 'var(--color-yellow)';
        
        window.Network.initGuest(
            code,
            () => {
                document.getElementById('join-status').textContent = 'Connected! Retrieving game info...';
                document.getElementById('join-status').style.color = 'var(--color-green)';
                document.getElementById('join-btn').disabled = true;
            },
            (data) => handleNetworkData(data),
            (err) => {
                document.getElementById('join-status').textContent = 'Connection failed. Check code.';
                document.getElementById('join-status').style.color = 'var(--color-red)';
                document.getElementById('join-btn').disabled = false;
            }
        );
    });

    // In-game quit and restart handlers
    document.getElementById('back-btn').addEventListener('click', () => {
        document.getElementById('quit-modal').classList.remove('hidden');
    });

    document.getElementById('quit-yes-btn').addEventListener('click', () => {
        if(window.Network && window.Network.isConnected) window.Network.disconnect();
        window.location.reload();
    });

    document.getElementById('quit-no-btn').addEventListener('click', () => {
        document.getElementById('quit-modal').classList.add('hidden');
    });

    document.getElementById('play-again-btn').addEventListener('click', () => {
        document.getElementById('game-over-modal').classList.add('hidden');
        if (AppState.gameConfig.mode === 'host' || AppState.gameConfig.mode === 'join') {
            if (AppState.gameConfig.mode === 'host') {
                window.Network.send({ type: 'play-again' });
                startGame(true);
            } else {
                document.getElementById('winner-text').innerHTML = "Waiting for Host...";
                document.getElementById('winner-text').style.color = "white";
                document.getElementById('play-again-btn').style.display = "none";
            }
        } else {
            startGame();
        }
    });
    
    document.getElementById('main-menu-btn').addEventListener('click', () => {
        if(window.Network && window.Network.isConnected) window.Network.disconnect();
        window.location.reload();
    });
}

function handleNetworkData(data) {
    if (data.type === 'config') {
        // Mutate existing objects to preserve references for event listeners
        Object.assign(AppState.gameConfig.p1, data.config.p1);
        Object.assign(AppState.gameConfig.p2, data.config.p2);
        AppState.gameConfig.gridSize = data.config.gridSize;
        
        // Host sent config. Proceed to config screen for joiner.
        document.getElementById('join-enter-screen').classList.add('hidden');
        document.getElementById('join-config-screen').classList.remove('hidden');
        
        const startBtn = document.getElementById('start-btn');
        startBtn.style.display = 'block';
        startBtn.disabled = false;
        startBtn.innerHTML = 'Ready';

        // Dim options the host took
        const p1c = AppState.gameConfig.p1.color;
        const p1s = AppState.gameConfig.p1.symbol;
        
        document.querySelectorAll('#join-p2-color .color-btn').forEach(btn => {
            btn.classList.remove('disabled');
            if(btn.dataset.value === p1c) btn.classList.add('disabled');
        });
        document.querySelectorAll('#join-p2-symbol .symbol-btn').forEach(btn => {
            btn.classList.remove('disabled');
            if(btn.dataset.value === p1s) btn.classList.add('disabled');
        });

    } else if (data.type === 'p2-config') {
        // As a host, we received the guest's choice
        AppState.gameConfig.p2 = data.p2;
        document.getElementById('host-status').textContent = 'Friend Ready!';
        document.getElementById('host-status').style.color = 'var(--color-green)';
        const startBtn = document.getElementById('start-btn');
        startBtn.disabled = false;
        startBtn.innerHTML = 'Start Remote Game';
    } else if (data.type === 'start') {
        document.getElementById('game-over-modal').classList.add('hidden');
        startGame(true);
    } else if (data.type === 'move') {
        window.Game.makeMove(data.x, data.y, data.dir, true);
    } else if (data.type === 'play-again') {
        document.getElementById('game-over-modal').classList.add('hidden');
        startGame(true);
    }
}

function validateSelection() {
    const errorMsg = document.getElementById('setup-error');
    errorMsg.textContent = '';
    
    if (AppState.gameConfig.mode === 'cpu' || AppState.gameConfig.mode === 'host') {
        const remainingColors = ['green', 'red', 'yellow', 'blue'].filter(c => c !== AppState.gameConfig.p1.color);
        const remainingSymbols = ['sun', 'moon', 'star'].filter(s => s !== AppState.gameConfig.p1.symbol);
        AppState.gameConfig.p2.color = remainingColors[0];
        AppState.gameConfig.p2.symbol = remainingSymbols[0];
        return true;
    }

    if (AppState.gameConfig.mode === 'friend') {
        const p1 = AppState.gameConfig.p1;
        const p2 = AppState.gameConfig.p2;

        if (p1.color === p2.color) {
            errorMsg.textContent = "Players must choose different colors.";
            return false;
        }
        if (p1.symbol === p2.symbol) {
            errorMsg.textContent = "Players must choose different symbols.";
            return false;
        }
    }
    return true;
}

function switchScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    AppState.screen = screenId;
}

function startGame(fromNetwork = false) {
    switchScreen('game-screen');
    if(window.Game) {
        window.Game.init(AppState.gameConfig);
    }
}
