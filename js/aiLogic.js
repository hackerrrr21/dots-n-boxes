window.AI = {
    playTurn: function() {
        const state = window.Game.state;
        const config = window.Game.config;
        
        // Safety checks
        if(state.gameOver || state.turn !== 'p2' || config.mode !== 'cpu') return;

        // Gather all possible moves
        const possibleMoves = [];
        
        // Horizontal lines
        for (let y = 0; y < config.gridSize; y++) {
            for (let x = 0; x < config.gridSize - 1; x++) {
                if (!state.lines[`${x},${y},h`]) {
                    possibleMoves.push({x, y, dir: 'h'});
                }
            }
        }
        
        // Vertical lines
        for (let y = 0; y < config.gridSize - 1; y++) {
            for (let x = 0; x < config.gridSize; x++) {
                if (!state.lines[`${x},${y},v`]) {
                    possibleMoves.push({x, y, dir: 'v'});
                }
            }
        }

        if (possibleMoves.length === 0) return;

        let chosenMove = null;

        // Strategy 1: Find a move that completes a box immediately
        for (let move of possibleMoves) {
            if (this.willCompleteBox(move.x, move.y, move.dir, state, config.gridSize)) {
                chosenMove = move;
                break;
            }
        }

        // Strategy 2: If no immediate completion, pick a move that doesn't give opponent a 3rd line
        if (!chosenMove) {
            const safeMoves = possibleMoves.filter(move => 
                !this.willGiveBox(move.x, move.y, move.dir, state, config.gridSize)
            );
            
            if (safeMoves.length > 0) {
                // Pick a random safe move
                chosenMove = safeMoves[Math.floor(Math.random() * safeMoves.length)];
            } else {
                // All moves give away a box; just pick randomly
                chosenMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
            }
        }

        if (chosenMove) {
            window.Game.makeMove(chosenMove.x, chosenMove.y, chosenMove.dir);
        }
    },
    
    countLinesInBox: function(bx, by, state) {
        let count = 0;
        if (state.lines[`${bx},${by},h`]) count++;
        if (state.lines[`${bx},${by + 1},h`]) count++;
        if (state.lines[`${bx},${by},v`]) count++;
        if (state.lines[`${bx + 1},${by},v`]) count++;
        return count;
    },

    getAffectedBoxes: function(x, y, dir, size) {
        let boxes = [];
        if (dir === 'h') {
            if (y > 0) boxes.push({bx: x, by: y - 1});
            if (y < size - 1) boxes.push({bx: x, by: y});
        } else { // 'v'
            if (x > 0) boxes.push({bx: x - 1, by: y});
            if (x < size - 1) boxes.push({bx: x, by: y});
        }
        return boxes;
    },

    willCompleteBox: function(x, y, dir, state, size) {
        const boxes = this.getAffectedBoxes(x, y, dir, size);
        for (let b of boxes) {
            if (this.countLinesInBox(b.bx, b.by, state) === 3) return true;
        }
        return false;
    },

    willGiveBox: function(x, y, dir, state, size) {
        const boxes = this.getAffectedBoxes(x, y, dir, size);
        for (let b of boxes) {
            // If the box already has 2 lines, adding another gives it 3, meaning the next player can claim it
            if (this.countLinesInBox(b.bx, b.by, state) === 2) return true;
        }
        return false;
    }
};
