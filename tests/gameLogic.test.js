global.window = {
    UI: {
        initBoard: jest.fn(),
        updateScores: jest.fn(),
        updateTurn: jest.fn(),
        drawLine: jest.fn(),
        fillBox: jest.fn()
    },
    Network: {
        send: jest.fn()
    }
};

const fs = require('fs');
const path = require('path');
const gameLogicCode = fs.readFileSync(path.resolve(__dirname, '../js/gameLogic.js'), 'utf8');
eval(gameLogicCode);

describe('GameLogic Integrations', () => {
    beforeEach(() => {
        window.Game.init({
            mode: 'friend',
            gridSize: 8,
            p1: { color: 'green', symbol: 'sun' },
            p2: { color: 'red', symbol: 'moon' }
        });
    });

    test('initializes state correctly', () => {
        expect(window.Game.state.turn).toBe('p1');
        expect(window.Game.state.scores.p1).toBe(0);
        expect(window.Game.state.scores.p2).toBe(0);
        expect(window.Game.state.gameOver).toBe(false);
    });

    test('validates simple moves', () => {
        const result = window.Game.makeMove(0, 0, 'h');
        expect(result).toBe(true); // Returns true on valid move
        expect(window.Game.state.lines['0,0,h']).toBe('p1');
        
        // Turn switches to p2 since no box was completed
        expect(window.Game.state.turn).toBe('p2');
    });

    test('rejects duplicate moves', () => {
        window.Game.makeMove(0, 0, 'h');
        const duplicate = window.Game.makeMove(0, 0, 'h');
        expect(duplicate).toBe(false);
    });

    test('detects completed boxes and awards points', () => {
        window.Game.makeMove(0, 0, 'h'); // P1
        window.Game.makeMove(0, 0, 'v'); // P2
        window.Game.makeMove(1, 0, 'v'); // P1
        
        // Final move to close the 0,0 box (bottom line)
        window.Game.makeMove(0, 1, 'h'); // P2

        // P2 completed the box, so P2 should have 1 point and keep their turn
        expect(window.Game.state.scores.p2).toBe(1);
        expect(window.Game.state.turn).toBe('p2'); 
        expect(window.Game.state.boxes['0,0']).toBe('p2');
    });
});
