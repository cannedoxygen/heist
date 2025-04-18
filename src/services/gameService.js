// src/services/gameService.js
import { GameEngine } from '../game/engine';

// Game service singleton
let gameInstance = null;

// Game service for managing game instances
export const gameService = {
  // Initialize game
  initialize: (containerId, scoreCallback, gameOverCallback) => {
    // If already initialized, destroy first
    if (gameInstance) {
      gameService.destroy();
    }
    
    try {
      // Check if container exists
      const container = document.getElementById(containerId);
      if (!container) {
        console.error(`Container element with ID "${containerId}" not found!`);
        return null;
      }
      
      gameInstance = new GameEngine(
        containerId,
        scoreCallback,
        gameOverCallback
      );
      
      gameInstance.init();
      console.log("Game engine initialized successfully");
      
      return gameInstance;
    } catch (error) {
      console.error("Error in gameService.initialize:", error);
      return null;
    }
  },
  
  // Get game instance
  getInstance: () => {
    return gameInstance;
  },
  
  // Start game with difficulty
  startGame: (difficulty = 'normal') => {
    if (!gameInstance) {
      console.error("startGame called but no game instance exists");
      return;
    }
    
    try {
      console.log("gameService.startGame called with difficulty:", difficulty);
      
      // Skip automatic resize to prevent dimension changes
      
      // First, trigger the startGame event on the game instance
      if (gameInstance.game && gameInstance.game.events) {
        console.log("Emitting startGame event to game instance");
        gameInstance.game.events.emit('startGame');
      }
      
      // Then call the engine's start method
      gameInstance.start(difficulty);
      console.log("gameService.startGame completed");
    } catch (error) {
      console.error("Error in gameService.startGame:", error);
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
  
  // Resize method
  resize: () => {
    if (gameInstance) {
      // Check if game instance has a resize method
      if (typeof gameInstance.resize === 'function') {
        gameInstance.resize();
      } else {
        // Fallback to handleResize if it exists
        if (typeof gameInstance.handleResize === 'function') {
          gameInstance.handleResize();
        }
      }
    }
  },
  
  // Destroy game instance with error handling
  destroy: () => {
    try {
      if (gameInstance) {
        gameInstance.destroy();
        gameInstance = null;
      }
    } catch (error) {
      console.error("Error in gameService.destroy:", error);
      // Force cleanup even if there was an error
      gameInstance = null;
    }
  }
};

export default gameService;