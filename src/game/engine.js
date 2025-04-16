import Phaser from 'phaser';
import { MainScene } from './scenes/mainScene';
import { GameOverScene } from './scenes/gameOverScene';

// Game configuration
const gameConfig = {
  type: Phaser.AUTO, // Try Phaser.CANVAS if WebGL is causing issues
  width: 800,
  height: 400,
  parent: 'game-container',
  backgroundColor: '#0a0e17',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  render: {
    pixelArt: false,
    antialias: true
  },
  // Add these callbacks to see if Phaser is initializing correctly
  callbacks: {
    preBoot: function (game) {
      console.log('Phaser preBoot');
    },
    postBoot: function (game) {
      console.log('Phaser postBoot');
    }
  }
};

// Initialize game class
export class GameEngine {
  constructor(containerId, scoreCallback, gameOverCallback) {
    // Store container ID
    this.containerId = containerId || 'game-container';
    
    // Store callbacks
    this.scoreCallback = scoreCallback;
    this.gameOverCallback = gameOverCallback;
    
    // Game instance
    this.game = null;
    
    // Game state
    this.isRunning = false;
    this.currentScore = 0;
    this.difficulty = 'normal';
    
    // Initialize audio settings
    this.isMuted = false;
    this.volume = 0.7;
  }
  
  // Initialize game
  init() {
    console.log('Initializing game engine');
    
    if (this.game) {
      console.log('Game already initialized, returning');
      return;
    }
    
    // Update config with container ID
    const config = {
      ...gameConfig,
      parent: this.containerId
    };
    
    // Log the container and check if it exists
    console.log('Game container:', this.containerId);
    const containerElement = document.getElementById(this.containerId);
    console.log('Container element exists:', !!containerElement);
    
    try {
      // Create new Phaser game
      console.log('Creating new Phaser game with config:', config);
      this.game = new Phaser.Game(config);
      
      // Add scenes
      this.game.scene.add('MainScene', MainScene);
      this.game.scene.add('GameOverScene', GameOverScene);
      
      // Listen for score updates
      this.game.events.on('updateScore', this.handleScoreUpdate, this);
      
      // Listen for game over
      this.game.events.on('gameOver', this.handleGameOver, this);
      
      // Listen for leaderboard view
      this.game.events.on('viewLeaderboard', this.handleViewLeaderboard, this);
      
      // Start with main scene
      this.game.scene.start('MainScene', { difficulty: this.difficulty });
      
      console.log('Game initialization complete');
    } catch (error) {
      console.error('Error initializing game:', error);
    }
  }
  
  // Start game
  start(difficulty = 'normal') {
    console.log('Starting game with difficulty:', difficulty);
    
    if (!this.game) {
      console.log('Game not initialized, initializing now');
      this.init();
    }
    
    this.difficulty = difficulty;
    this.isRunning = true;
    this.currentScore = 0;
    
    // Start main scene with difficulty
    this.game.scene.start('MainScene', { difficulty });
    
    console.log('Game started');
  }
  
  // Stop game
  stop() {
    console.log('Stopping game');
    
    if (this.game && this.isRunning) {
      this.isRunning = false;
      this.game.scene.stop('MainScene');
      console.log('Game stopped');
    } else {
      console.log('Game not running, nothing to stop');
    }
  }
  
  // Handle score updates
  handleScoreUpdate(points) {
    this.currentScore += points;
    
    // Call external score callback if provided
    if (this.scoreCallback) {
      this.scoreCallback(this.currentScore);
    }
  }
  
  // Handle game over
  handleGameOver(finalScore) {
    console.log('Game over handler called with score:', finalScore);
    
    this.isRunning = false;
    
    // Call external game over callback if provided
    if (this.gameOverCallback) {
      console.log('Calling game over callback');
      this.gameOverCallback(finalScore);
    } else {
      console.log('No game over callback provided');
    }
  }
  
  // Handle view leaderboard request
  handleViewLeaderboard() {
    // This will be handled by React router
    if (window.location) {
      window.location.href = '/leaderboard';
    }
  }
  
  // Set game volume
  setVolume(volume) {
    this.volume = volume;
    
    if (this.game && this.game.sound) {
      this.game.sound.volume = volume;
    }
  }
  
  // Toggle mute
  toggleMute() {
    this.isMuted = !this.isMuted;
    
    if (this.game && this.game.sound) {
      this.game.sound.mute = this.isMuted;
    }
  }
  
  // Resize game
  resize() {
    if (this.game) {
      this.game.scale.resize(window.innerWidth, window.innerHeight);
    }
  }
  
  // Destroy game instance
  destroy() {
    console.log('Destroying game instance');
    
    if (this.game) {
      this.game.events.off('updateScore');
      this.game.events.off('gameOver');
      this.game.events.off('viewLeaderboard');
      
      try {
        // Try to destroy the Phaser game
        this.game.destroy(true);
        this.game = null;
        console.log('Game instance destroyed');
      } catch (error) {
        console.error('Error destroying game:', error);
      }
    } else {
      console.log('No game instance to destroy');
    }
  }
}

export default GameEngine;