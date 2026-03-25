window.Input = {
    attachListeners: function() {
        // Find all line elements
        const lines = document.querySelectorAll('.line');
        
        lines.forEach(line => {
            // Remove any existing listeners by cloning the node
            const clone = line.cloneNode(true);
            line.parentNode.replaceChild(clone, line);
            
            clone.addEventListener('click', (e) => {
                const el = e.target;
                
                // Ignore if line is already drawn
                if(el.classList.contains('drawn')) return;
                
                // Ignore clicks if it's CPU's turn
                if(window.Game.config.mode === 'cpu' && window.Game.state.turn === 'p2') return;

                const x = parseInt(el.dataset.x);
                const y = parseInt(el.dataset.y);
                const dir = el.dataset.dir;

                // Send move to game logic
                window.Game.makeMove(x, y, dir);
            });
        });
    }
};
