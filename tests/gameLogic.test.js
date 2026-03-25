global.window = {
    UI: {
        initBoard: jest.fn(),
        updateScores: jest.fn(),
        updateTurn: jest.fn(),
        drawLine: jest.fn(),
        fillBox: jest.fn(),
        showGameOver: jest.fn()
    },
    Network: {
        send: jest.fn()
    },
    AI: {
        playTurn: jest.fn()
    }
};

const fs = require('fs');
const path = require('path');
const gameLogicCode = fs.readFileSync(path.resolve(__dirname, '../js/gameLogic.js'), 'utf8');
eval(gameLogicCode);

describe('GameLogic Integrations', () => {
    beforeEach(() => {
        // Mock setTimeout to instantly resolve to avoid dangling handles
        jest.useFakeTimers();
        
        window.Game.init({
            mode: 'friend',
            gridSize: 3, 
            p1: { color: 'green', symbol: 'sun' },
            p2: { color: 'red', symbol: 'moon' }
        });
        jest.clearAllMocks();
    });
    
    afterEach(() => {
        jest.useRealTimers();
    });

    test('initializes state structurally', () => {
        // Total boxes for 3x3 grid = 2x2 = 4
        expect(window.Game.state.turn).toBe('p1');
        expect(window.Game.state.scores.p1).toBe(0);
        expect(window.Game.state.scores.p2).toBe(0);
        expect(window.Game.state.totalBoxes).toBe(4);
        expect(window.Game.state.gameOver).toBe(false);
    });

    test('accepts valid geometric moves and switches turns', () => {
        const result = window.Game.makeMove(0, 0, 'h');
        expect(result).toBe(true);
        expect(window.Game.state.lines['0,0,h']).toBe('p1');
        expect(window.Game.state.turn).toBe('p2'); // Switched turn
        expect(window.UI.drawLine).toHaveBeenCalledWith(0, 0, 'h', 'p1', 'green');
    });

    test('rejects identical duplicate mutations', () => {
        window.Game.makeMove(0, 0, 'h');
        const duplicate = window.Game.makeMove(0, 0, 'h');
        expect(duplicate).toBe(false);
    });

    test('blocks local moves if it is not the players network turn in remote modes', () => {
        window.Game.config.mode = 'host';
        window.Game.state.turn = 'p2'; // Not P1's turn
        // P1 tries to move locally
        expect(window.Game.makeMove(0, 0, 'h', false)).toBe(false);
        // Network sends move
        expect(window.Game.makeMove(0, 0, 'h', true)).toBe(true);
    });

    test('detects single box completion and retains turn possession', () => {
        window.Game.makeMove(0, 0, 'h'); // p1
        window.Game.makeMove(0, 0, 'v'); // p2
        window.Game.makeMove(1, 0, 'v'); // p1
        
        // P2 finishes it
        const result = window.Game.makeMove(0, 1, 'h'); // p2
        
        expect(result).toBe(true);
        expect(window.Game.state.scores.p2).toBe(1);
        expect(window.Game.state.turn).toBe('p2'); // Kept turn
        expect(window.Game.state.boxes['0,0']).toBe('p2');
        expect(window.UI.fillBox).toHaveBeenCalledWith(0, 0, 'moon', 'red');
    });

    test('detects dual-box cascade completions in a single move', () => {
        // We will build two adjacent boxes and close them with the shared middle wall
        // Top Box (0,0) and Bottom Box (0,1) sharing horizontal line (0,1,h)
        window.Game.makeMove(0, 0, 'h'); // line 1
        window.Game.makeMove(0, 0, 'v'); // line 2
        window.Game.makeMove(1, 0, 'v'); // line 3
        
        window.Game.makeMove(0, 1, 'v'); // line 4
        window.Game.makeMove(1, 1, 'v'); // line 5
        window.Game.makeMove(0, 2, 'h'); // line 6
        
        // Closing the shared line (0,1,'h') finishes BOTH box(0,0) and box(0,1)
        expect(window.Game.state.scores.p1).toBe(0);
        window.Game.makeMove(0, 1, 'h');
        
        expect(window.Game.state.scores.p1).toBe(2);
        expect(window.Game.state.boxes['0,0']).toBe('p1');
        expect(window.Game.state.boxes['0,1']).toBe('p1');
        expect(window.Game.state.turn).toBe('p1');
    });

    test('triggers CPU AI when appropriate', () => {
        window.Game.config.mode = 'cpu';
        // P1 moves, turns passes to P2 (CPU)
        window.Game.makeMove(0, 0, 'h');
        expect(window.Game.state.turn).toBe('p2');
        
        // Fast forward timers to execute the setTimeout
        jest.runAllTimers();
        expect(window.AI.playTurn).toHaveBeenCalled();
    });

    test('triggers game over when board mathematically achieves capacity', () => {
        window.Game.state.boxes = {
            '0,0': 'p1',
            '1,0': 'p1',
            '0,1': 'p2',
            '1,1': 'p1'
        };
        window.Game.state.scores = { p1: 3, p2: 1 };
        window.Game.checkWinner();
        
        expect(window.Game.state.gameOver).toBe(true);
        expect(window.UI.showGameOver).toHaveBeenCalledWith('p1', window.Game.config);
    });
    
    test('identifies tie conditions perfectly', () => {
        window.Game.state.boxes = {
            '0,0': 'p1',
            '1,0': 'p1',
            '0,1': 'p2',
            '1,1': 'p2'
        };
        window.Game.state.scores = { p1: 2, p2: 2 };
        
        window.Game.checkWinner();
        expect(window.Game.state.gameOver).toBe(true);
        expect(window.UI.showGameOver).toHaveBeenCalledWith('tie', window.Game.config);
    });
});
