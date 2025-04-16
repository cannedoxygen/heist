import { GameEngine } from '../game/engine';

// Game service singleton
let gameInstance = null;

// Game service for managing game instances
export const gameService = {
  // Initialize game
  initialize: (containerId, scoreCallback, gameOverCallback) => {
    console.log("gameService.initialize called with containerId:", containerId);
    
    // If already initialized, destroy first
    if (gameInstance) {
      console.log("Game instance already exists, destroying first");
      gameService.destroy();
    }
    
    try {
      // Check if container exists
      const container = document.getElementById(containerId);
      if (!container) {
        console.error(`Container element with ID "${containerId}" not found!`);
        return null;
      }
      
      console.log("Creating new GameEngine instance");
      gameInstance = new GameEngine(
        containerId,
        scoreCallback,
        gameOverCallback
      );
      
      console.log("Initializing GameEngine");
      gameInstance.init();
      
      return gameInstance;
    } catch (error) {
      console.error("Error in gameService.initialize:", error);
      return null;
    }
  },
  
  // Get game instance
  getInstance: () => {
    if (!gameInstance) {
      console.warn("getInstance called but no game instance exists");
    }
    return gameInstance;
  },
  
  // Start game with difficulty
  startGame: (difficulty = 'normal') => {
    if (gameInstance) {
      console.log("Starting game with difficulty:", difficulty);
      gameInstance.start(difficulty);
    } else {
      console.error("startGame called but no game instance exists");
    }
  },
  
  // Stop game
  stopGame: () => {
    if (gameInstance) {
      console.log("Stopping game");
      gameInstance.stop();
    } else {
      console.warn("stopGame called but no game instance exists");
    }
  },
  
  // Set volume
  setVolume: (volume) => {
    if (gameInstance) {
      gameInstance.setVolume(volume);
    } else {
      console.warn("setVolume called but no game instance exists");
    }
  },
  
  // Toggle mute
  toggleMute: () => {
    if (gameInstance) {
      gameInstance.toggleMute();
    } else {
      console.warn("toggleMute called but no game instance exists");
    }
  },
  
  // Destroy game instance with better error handling
  destroy: () => {
    try {
      if (gameInstance) {
        console.log("Destroying game instance");
        gameInstance.destroy();
        gameInstance = null;
        console.log("Game instance destroyed successfully");
      } else {
        console.log("No game instance to destroy");
      }
    } catch (error) {
      console.error("Error in gameService.destroy:", error);
      // Force cleanup even if there was an error
      gameInstance = null;
    }
  }
};

export default gameService;