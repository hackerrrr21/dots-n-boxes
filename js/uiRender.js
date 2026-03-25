window.UI = {
    initBoard: function(size) {
        this.size = size;
        const board = document.getElementById('board');
        board.innerHTML = '';
        
        // Calculate dynamic dimensions
        // Grid spacing determines how large the boxes and lines are
        const spacing = 45;
        const padding = 30; // matches css .board padding
        
        board.style.width = `${(size - 1) * spacing + padding * 2}px`;
        board.style.height = `${(size - 1) * spacing + padding * 2}px`;

        // We create boxes first so lines map on top of box backgrounds, dots on top of lines

        // Create boxes
        for (let y = 0; y < size - 1; y++) {
            for (let x = 0; x < size - 1; x++) {
                const box = document.createElement('div');
                box.className = 'box';
                box.id = `box-${x}-${y}`;
                box.style.left = `${padding + x * spacing + 8}px`; // Extra 8px spacing for offset inside grid
                box.style.top = `${padding + y * spacing + 8}px`;
                box.style.width = `${spacing - 16}px`;
                box.style.height = `${spacing - 16}px`;
                board.appendChild(box);
            }
        }

        // Create horizontal lines
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size - 1; x++) {
                const line = document.createElement('div');
                line.className = 'line horizontal';
                line.id = `line-h-${x}-${y}`;
                line.dataset.x = x;
                line.dataset.y = y;
                line.dataset.dir = 'h';
                line.style.left = `${padding + x * spacing + 8}px`; 
                line.style.top = `${padding + y * spacing}px`;
                line.style.width = `${spacing - 16}px`;
                board.appendChild(line);
            }
        }

        // Create vertical lines
        for (let y = 0; y < size - 1; y++) {
            for (let x = 0; x < size; x++) {
                const line = document.createElement('div');
                line.className = 'line vertical';
                line.id = `line-v-${x}-${y}`;
                line.dataset.x = x;
                line.dataset.y = y;
                line.dataset.dir = 'v';
                line.style.left = `${padding + x * spacing}px`;
                line.style.top = `${padding + y * spacing + 8}px`;
                line.style.height = `${spacing - 16}px`;
                board.appendChild(line);
            }
        }

        // Create dots
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const dot = document.createElement('div');
                dot.className = 'dot';
                dot.style.left = `${padding + x * spacing}px`;
                dot.style.top = `${padding + y * spacing}px`;
                board.appendChild(dot);
            }
        }

        window.Input.attachListeners();
        
        // Auto scale to fit `.board-wrapper`
        const boardWidth = (size - 1) * spacing + padding * 2;
        const resizeBoard = () => {
            const wrapper = document.querySelector('.board-wrapper');
            if(!wrapper) return;
            const maxWidth = wrapper.clientWidth - 40;
            const maxHeight = wrapper.clientHeight - 40;
            const scaleFactor = Math.min(1, maxWidth / boardWidth, maxHeight / boardWidth);
            board.style.transform = `translate(-50%, -50%) scale(${scaleFactor})`;
        };
        resizeBoard();
        window.addEventListener('resize', resizeBoard);
        
        // Setup player config UI globally
        const getSym = (s) => s === 'sun' ? '☀️' : (s === 'moon' ? '🌙' : '⭐');
        document.querySelector('.p1-avatar').textContent = getSym(window.Game.config.p1.symbol);
        document.querySelector('.p2-avatar').textContent = getSym(window.Game.config.p2.symbol);
        
        document.querySelector('#score-p1').style.color = `var(--color-${window.Game.config.p1.color})`;
        document.querySelector('#score-p2').style.color = `var(--color-${window.Game.config.p2.color})`;
    },

    drawLine: function(x, y, dir, player, colorName) {
        const line = document.getElementById(`line-${dir}-${x}-${y}`);
        if(line) {
            line.classList.add('drawn');
            line.style.backgroundColor = `var(--color-${colorName})`;
            line.style.opacity = '1';
            line.style.boxShadow = `0 0 10px var(--color-${colorName})`;
        }
    },

    fillBox: function(bx, by, symbol, colorName) {
        const box = document.getElementById(`box-${bx}-${by}`);
        if(box) {
            box.classList.add('filled');
            const getSym = (s) => s === 'sun' ? '☀️' : (s === 'moon' ? '🌙' : '⭐');
            box.textContent = getSym(symbol);
            box.style.color = `var(--color-${colorName})`;
            box.style.textShadow = `0 0 15px var(--color-${colorName})`;
        }
    },

    updateScores: function(state) {
        document.querySelector('#score-p1 .score-val').textContent = state.scores.p1;
        document.querySelector('#score-p2 .score-val').textContent = state.scores.p2;
    },

    updateTurn: function(turnId) {
        const indicator = document.getElementById('turn-indicator');
        indicator.textContent = (turnId === 'p1') ? 'P1 Turn' : (window.Game.config.mode === 'cpu' ? 'CPU Turn' : 'P2 Turn');
        
        const style1 = document.getElementById('score-p1');
        const style2 = document.getElementById('score-p2');
        if(turnId === 'p1') {
            style1.classList.add('active');
            style2.classList.remove('active');
        } else {
            style1.classList.remove('active');
            style2.classList.add('active');
        }
    },

    showGameOver: function(winner, config) {
        const modal = document.getElementById('game-over-modal');
        const text = document.getElementById('winner-text');
        
        if (winner === 'tie') {
            text.textContent = "It's a Tie!";
            text.style.color = 'var(--text-primary)';
        } else {
            const playerLabel = winner === 'p1' ? 'Player 1' : (config.mode === 'cpu' ? 'Computer' : 'Player 2');
            text.textContent = `${playerLabel} Wins!`;
            text.style.color = `var(--color-${config[winner].color})`;
        }
        
        modal.classList.remove('hidden');
    }
};
