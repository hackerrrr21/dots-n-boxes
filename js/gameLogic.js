window.Game = {
    state: {},
    config: {},

    init: function(config) {
        this.config = config;
        this.state = {
            turn: 'p1', // 'p1' or 'p2'
            scores: { p1: 0, p2: 0 },
            lines: {}, // Keyed by "x,y,dir" -> holding player id
            boxes: {}, // Keyed by "x,y" -> holding player id
            totalBoxes: (config.gridSize - 1) * (config.gridSize - 1),
            gameOver: false
        };

        window.UI.initBoard(config.gridSize);
        window.UI.updateScores(this.state);
        window.UI.updateTurn(this.state.turn);
    },

    makeMove: function(x, y, dir, fromNetwork = false) {
        const lineKey = `${x},${y},${dir}`;
        if (this.state.lines[lineKey] || this.state.gameOver) return false;

        // Remote play logic: Disallow local moves if it's not our turn
        if (this.config.mode === 'host' && this.state.turn !== 'p1' && !fromNetwork) return false;
        if (this.config.mode === 'join' && this.state.turn !== 'p2' && !fromNetwork) return false;

        // Dispatch move over network if locally played
        if ((this.config.mode === 'host' || this.config.mode === 'join') && !fromNetwork) {
            window.Network.send({ type: 'move', x, y, dir });
        }

        // Register the drawn line
        this.state.lines[lineKey] = this.state.turn;
        window.UI.drawLine(x, y, dir, this.state.turn, this.config[this.state.turn].color);

        // Check if any boxes were completed
        const boxesCompleted = this.checkBoxes(x, y, dir);

        if (boxesCompleted > 0) {
            this.state.scores[this.state.turn] += boxesCompleted;
            window.UI.updateScores(this.state);
            this.checkWinner();
        } else {
            // Switch turns
            this.state.turn = this.state.turn === 'p1' ? 'p2' : 'p1';
            window.UI.updateTurn(this.state.turn);

            // Trigger AI if it's currently CPU's mode and turn
            if (this.config.mode === 'cpu' && this.state.turn === 'p2' && !this.state.gameOver) {
                setTimeout(() => window.AI.playTurn(), 500);
            }
        }
        return true;
    },

    checkBoxes: function(x, y, dir) {
        let completed = 0;
        let boxesToCheck = [];

        // Identify which boxes might be completed by this line
        if (dir === 'h') {
            if (y > 0) boxesToCheck.push({bx: x, by: y - 1}); // Box above
            if (y < this.config.gridSize - 1) boxesToCheck.push({bx: x, by: y}); // Box below
        } else { // 'v'
            if (x > 0) boxesToCheck.push({bx: x - 1, by: y}); // Box left
            if (x < this.config.gridSize - 1) boxesToCheck.push({bx: x, by: y}); // Box right
        }

        boxesToCheck.forEach(box => {
            if (this.isBoxComplete(box.bx, box.by) && !this.state.boxes[`${box.bx},${box.by}`]) {
                this.state.boxes[`${box.bx},${box.by}`] = this.state.turn;
                window.UI.fillBox(
                    box.bx, 
                    box.by, 
                    this.config[this.state.turn].symbol, 
                    this.config[this.state.turn].color
                );
                completed++;
            }
        });

        return completed;
    },

    isBoxComplete: function(bx, by) {
        return this.state.lines[`${bx},${by},h`] &&        // Top edge
               this.state.lines[`${bx},${by + 1},h`] &&    // Bottom edge
               this.state.lines[`${bx},${by},v`] &&        // Left edge
               this.state.lines[`${bx + 1},${by},v`];      // Right edge
    },

    checkWinner: function() {
        if (Object.keys(this.state.boxes).length === this.state.totalBoxes) {
            this.state.gameOver = true;
            let winner = 'tie';
            if (this.state.scores.p1 > this.state.scores.p2) winner = 'p1';
            else if (this.state.scores.p2 > this.state.scores.p1) winner = 'p2';
            
            window.UI.showGameOver(winner, this.config);
        } else {
            // CPU gets an extra turn on box completion
            if (this.config.mode === 'cpu' && this.state.turn === 'p2') {
                setTimeout(() => window.AI.playTurn(), 600);
            }
        }
    }
};
