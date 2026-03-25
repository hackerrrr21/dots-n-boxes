# Dots and Boxes Classic

A modern, highly aesthetic, and fully responsive vanilla web implementation of the classic pen-and-paper game "Dots and Boxes".

## Features
- **Three Game Modes**:
  - **Single Player (vs CPU)**: Play against a smart AI that knows how to prioritize enclosing boxes and avoiding giving away free moves.
  - **Local Multiplayer**: Play with a friend on the same device.
  - **Remote Multiplayer (P2P)**: Host or join a remote game over the internet using WebRTC (powered by PeerJS). No dedicated backend required!
- **Deeply Customizable**: Choose your preferred grid size (8x8 or 12x12), player color (Green, Red, Yellow, Blue), and avatar symbol (Sun ☀️, Moon 🌙, Star ⭐).
- **Responsive Design**: Play flawlessly on desktop or mobile. The UI intelligently scales the board to fit any screen size while maintaining perfectly crisp layouts.
- **Modern Aesthetics**: Built with premium glassmorphism styling, animated loading screens, and smooth interactive hover effects.

## Clean Architecture
This project is built using **pure Vanilla HTML, CSS, and JS**, with absolutely zero framework lock-in or build-step requirements. The codebase is broken down into modular, highly maintainable files:
- `index.html`: UI Structure.
- `css/style.css`: Design system and responsive layouts.
- `js/main.js`: Setup UI state management and flow coordination.
- `js/gameLogic.js`: Core game rules, scoring, and turn-taking validation.
- `js/uiRender.js`: Dynamic DOM generation and responsive board scaling.
- `js/inputHandler.js`: Event listeners for player moves.
- `js/aiLogic.js`: The computer opponent's decision-making algorithm.
- `js/networkLogic.js`: WebRTC peer-to-peer data synchronization.

## How to Play
Because there is no backend server or Node.js required, you can play this game instantly:
1. Double-click `index.html` to open it in your browser, or host the folder using any simple static web server (e.g., `python -m http.server 8181`).
2. Select your game mode. 
3. If playing **Remote Multiplayer**, the Host generates a 6-character room code. Give that code to your friend to enter on their screen, wait for them to choose their configurations, and start playing!
