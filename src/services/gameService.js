import { GameEngine } from '../game/engine';

// Game service singleton
let gameInstance = null;

// Game service for managing game instances
export const gameService = {
  // Initialize game
  initialize: (containerId, scoreCallback, gameOverCallback) => {
    if (!gameInstance) {
      gameInstance = new GameEngine(
        containerId,
        scoreCallback,
        gameOverCallback
      );
      gameInstance.init();
    }
    return gameInstance;
  },
  
  // Get game instance
  getInstance: () => {
    return gameInstance;
  },
  
  // Start game with difficulty
  startGame: (difficulty = 'normal') => {
    if (gameInstance) {
      gameInstance.start(difficulty);
    }
  },
  
  // Stop game
  stopGame: () => {
    if (gameInstance) {
      gameInstance.stop();
    }
  },
  
  // Set volume
  setVolume: (volume) => {
    if (gameInstance) {
      gameInstance.setVolume(volume);
    }
  },
  
  // Toggle mute
  toggleMute: () => {
    if (gameInstance) {
      gameInstance.toggleMute();
    }
  },
  
  // Destroy game instance
  destroy: () => {
    if (gameInstance) {
      gameInstance.destroy();
      gameInstance = null;
    }
  }
};

export default gameService;