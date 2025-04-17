// src/game/engine.js - UPDATED
import Phaser from 'phaser';
import { MainScene } from './scenes/mainScene';
import { GameOverScene } from './scenes/gameOverScene';

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
  
  // Initialize game with responsive sizing
  init() {
    console.log('Initializing game engine');
    
    if (this.game) {
      console.log('Game already initialized, returning');
      return;
    }
    
    // Get container element and dimensions
    const containerElement = document.getElementById(this.containerId);
    if (!containerElement) {
      console.error(`Container element with ID "${this.containerId}" not found!`);
      return;
    }
    
    // Get actual dimensions of the container
    const containerWidth = containerElement.offsetWidth;
    const containerHeight = containerElement.offsetHeight;
    
    console.log('Container dimensions:', containerWidth, 'x', containerHeight);
    
    // Create dynamic game config based on container size
    const config = {
      type: Phaser.AUTO,
      width: containerWidth,
      height: containerHeight,
      backgroundColor: '#0a0e17',
      parent: this.containerId,
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 0 },
          debug: false
        }
      },
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: containerWidth,
        height: containerHeight
      },
      render: {
        pixelArt: false,
        antialias: true
      }
    };
    
    try {
      // Create new Phaser game
      console.log('Creating new Phaser game with dimensions:', containerWidth, 'x', containerHeight);
      this.game = new Phaser.Game(config);
      
      // Store game dimensions in a global property that scenes can access
      this.game.gameWidth = containerWidth;
      this.game.gameHeight = containerHeight;
      
      // Add scenes
      this.game.scene.add('MainScene', MainScene);
      this.game.scene.add('GameOverScene', GameOverScene);
      
      // Listen for score updates
      this.game.events.on('updateScore', this.handleScoreUpdate, this);
      
      // Listen for game over
      this.game.events.on('gameOver', this.handleGameOver, this);
      
      // Relay events to React components
      this.setupEventRelay();
      
      // Start with main scene
      this.game.scene.start('MainScene', { 
        difficulty: this.difficulty,
        gameWidth: containerWidth,
        gameHeight: containerHeight
      });
      
      console.log('Game initialization complete');
    } catch (error) {
      console.error('Error initializing game:', error);
    }
  }
  
  // Setup event relay to bridge Phaser and React
  setupEventRelay() {
    // Handle window resize events
    window.addEventListener('resize', this.handleResize.bind(this));
    
    // Add custom event handlers if needed
    if (this.game) {
      // Example: Forward all relevant events to React
      ['data-collected', 'obstacle-hit', 'level-up'].forEach(eventName => {
        this.game.events.on(eventName, (data) => {
          // Create a custom event that React components can listen for
          const event = new CustomEvent(`game:${eventName}`, { detail: data });
          document.dispatchEvent(event);
        });
      });
    }
  }
  
  // Handle window resize
  handleResize() {
    if (!this.game) return;
    
    const containerElement = document.getElementById(this.containerId);
    if (!containerElement) return;
    
    const width = containerElement.offsetWidth;
    const height = containerElement.offsetHeight;
    
    console.log('Resizing game to:', width, 'x', height);
    
    // Update game dimensions
    this.game.scale.resize(width, height);
    
    // Store updated dimensions
    this.game.gameWidth = width;
    this.game.gameHeight = height;
    
    // Notify scenes about resize if they have a handleResize method
    const activeScene = this.game.scene.getScenes(true)[0];
    if (activeScene && typeof activeScene.handleResize === 'function') {
      activeScene.handleResize(width, height);
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
    
    // Get container dimensions
    const containerElement = document.getElementById(this.containerId);
    const width = containerElement ? containerElement.offsetWidth : 800;
    const height = containerElement ? containerElement.offsetHeight : 400;
    
    // Start main scene with difficulty and dimensions
    this.game.scene.start('MainScene', { 
      difficulty,
      gameWidth: width,
      gameHeight: height
    });
    
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
    this.handleResize();
  }
  
  // Destroy game instance
  destroy() {
    console.log('Destroying game instance');
    
    if (this.game) {
      // Remove event listeners
      window.removeEventListener('resize', this.handleResize);
      this.game.events.off('updateScore');
      this.game.events.off('gameOver');
      
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