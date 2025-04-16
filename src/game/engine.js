import Phaser from 'phaser';
import { MainScene } from './scenes/mainScene';
import { GameOverScene } from './scenes/gameOverScene';

// Game configuration
const gameConfig = {
  type: Phaser.AUTO,
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
    if (this.game) {
      return;
    }
    
    // Update config with container ID
    const config = {
      ...gameConfig,
      parent: this.containerId
    };
    
    // Create new Phaser game
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
  }
  
  // Start game
  start(difficulty = 'normal') {
    if (!this.game) {
      this.init();
    }
    
    this.difficulty = difficulty;
    this.isRunning = true;
    this.currentScore = 0;
    
    // Start main scene with difficulty
    this.game.scene.start('MainScene', { difficulty });
  }
  
  // Stop game
  stop() {
    if (this.game && this.isRunning) {
      this.isRunning = false;
      this.game.scene.stop('MainScene');
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
    this.isRunning = false;
    
    // Call external game over callback if provided
    if (this.gameOverCallback) {
      this.gameOverCallback(finalScore);
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
    if (this.game) {
      this.game.events.off('updateScore');
      this.game.events.off('gameOver');
      this.game.events.off('viewLeaderboard');
      this.game.destroy(true);
      this.game = null;
    }
  }
}

export default GameEngine;