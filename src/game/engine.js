// src/game/engine.js
import Phaser from 'phaser';
import { MainScene } from './scenes/mainScene';

export class GameEngine {
  constructor(containerId, scoreCallback, gameOverCallback) {
    // Store container ID and callbacks
    this.containerId = containerId || 'game-container';
    this.scoreCallback = scoreCallback;
    this.gameOverCallback = gameOverCallback;
    
    // Game instance
    this.game = null;
    
    // Game state
    this.isRunning = false;
    this.currentScore = 0;
    this.difficulty = 'normal';
    
    // Audio settings
    this.isMuted = false;
    this.volume = 0.7;
    
    // Event handlers bound to this context for easier removal
    this.boundHandleResize = this.handleResize.bind(this);
    this.boundHandleScoreUpdate = this.handleScoreUpdate.bind(this);
    this.boundHandleGameOver = this.handleGameOver.bind(this);
  }
  
  init() {
    // Prevent duplicate initialization
    if (this.game) {
      return;
    }
    
    // Get container element
    const containerElement = document.getElementById(this.containerId);
    if (!containerElement) {
      throw new Error(`Container element with ID "${this.containerId}" not found!`);
    }
    
    // Get container dimensions
    const containerWidth = containerElement.offsetWidth;
    const containerHeight = containerElement.offsetHeight;
    
    // Ensure valid dimensions
    if (containerWidth <= 0 || containerHeight <= 0) {
      throw new Error('Container has invalid dimensions. Width and height must be greater than 0.');
    }
    
    try {
      // Configure Phaser game instance
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
        },
        // Add explicit audio config
        audio: {
          disableWebAudio: false,
          noAudio: false
        }
      };
      
      // Create Phaser game instance
      this.game = new Phaser.Game(config);
      
      // Store dimensions for scene access
      this.game.gameWidth = containerWidth;
      this.game.gameHeight = containerHeight;
      
      // Add scenes
      this.game.scene.add('MainScene', MainScene);
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Start main scene
      this.game.scene.start('MainScene', { 
        difficulty: this.difficulty,
        gameWidth: containerWidth,
        gameHeight: containerHeight
      });
      
      console.log('Game engine initialized with dimensions:', containerWidth, 'x', containerHeight);
    } catch (error) {
      this.handleInitError(error);
      throw error;
    }
  }
  
  setupEventListeners() {
    // Add window resize listener
    window.addEventListener('resize', this.boundHandleResize);
    
    // Game event listeners
    if (this.game && this.game.events) {
      this.game.events.on('updateScore', this.boundHandleScoreUpdate);
      this.game.events.on('gameOver', this.boundHandleGameOver);
    }
  }
  
  removeEventListeners() {
    // Remove window listeners
    window.removeEventListener('resize', this.boundHandleResize);
    
    // Remove game listeners
    if (this.game && this.game.events) {
      this.game.events.off('updateScore', this.boundHandleScoreUpdate);
      this.game.events.off('gameOver', this.boundHandleGameOver);
    }
  }
  
  handleInitError(error) {
    // Clean up any partial initialization
    if (this.game) {
      this.removeEventListeners();
      try {
        this.game.destroy(true);
      } catch (destroyError) {
        // Ignore additional errors during cleanup
      }
      this.game = null;
    }
  }
  
  handleResize() {
    if (!this.game) return;
    
    const containerElement = document.getElementById(this.containerId);
    if (!containerElement) return;
    
    const width = containerElement.offsetWidth;
    const height = containerElement.offsetHeight;
    
    // Update game dimensions
    this.game.scale.resize(width, height);
    
    // Store updated dimensions
    this.game.gameWidth = width;
    this.game.gameHeight = height;
    
    // Notify current scene
    const activeScene = this.game.scene.getScenes(true)[0];
    if (activeScene && typeof activeScene.handleResize === 'function') {
      activeScene.handleResize(width, height);
    }
    
    console.log('Game resized to:', width, 'x', height);
  }
  
  start(difficulty = 'normal') {
    if (!this.game) {
      this.init();
    }
    
    this.difficulty = difficulty;
    this.isRunning = true;
    this.currentScore = 0;
    
    // Get container dimensions
    const containerElement = document.getElementById(this.containerId);
    const width = containerElement ? containerElement.offsetWidth : 800;
    const height = containerElement ? containerElement.offsetHeight : 400;
    
    // Start main scene
    this.game.scene.start('MainScene', { 
      difficulty,
      gameWidth: width,
      gameHeight: height
    });
    
    console.log('Game started with difficulty:', difficulty);
  }
  
  stop() {
    if (this.game && this.isRunning) {
      this.isRunning = false;
      this.game.scene.stop('MainScene');
      console.log('Game stopped');
    }
  }
  
  handleScoreUpdate(points) {
    // Only update score if a valid points value is provided
    if (typeof points === 'number' && !isNaN(points)) {
      this.currentScore += points;
      
      // Call external callback
      if (typeof this.scoreCallback === 'function') {
        this.scoreCallback(points);
      }
    }
  }
  
  handleGameOver(finalScore) {
    this.isRunning = false;
    
    // Call external callback with validated score
    if (typeof this.gameOverCallback === 'function') {
      const validScore = finalScore !== undefined ? finalScore : this.currentScore;
      this.gameOverCallback(validScore);
    }
    
    console.log('Game over with score:', finalScore);
  }
  
  setVolume(volume) {
    this.volume = volume;
    
    if (this.game && this.game.sound) {
      this.game.sound.volume = volume;
      console.log('Game volume set to:', volume);
    }
  }
  
  toggleMute() {
    this.isMuted = !this.isMuted;
    
    if (this.game && this.game.sound) {
      this.game.sound.mute = this.isMuted;
      console.log('Game sound muted:', this.isMuted);
    }
  }
  
  resize() {
    this.handleResize();
  }
  
  destroy() {
    // Prevent errors on destroy if already destroyed
    if (!this.game) return;
    
    // Clean up all resources
    this.removeEventListeners();
    
    try {
      // Stop all running scenes
      this.game.scene.scenes.forEach(scene => {
        if (scene.scene.isActive()) {
          this.game.scene.stop(scene.scene.key);
        }
      });
      
      // Destroy the game instance
      this.game.destroy(true);
      this.game = null;
      console.log('Game engine destroyed');
    } catch (error) {
      // Ignore errors during destroy
      this.game = null;
    }
  }
}

export default GameEngine;