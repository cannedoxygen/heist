// src/game/scenes/mainScene.js
import Phaser from 'phaser';
import { TronGrid } from '../TronGrid';
import { Player } from '../entities/player';

export class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene');
    
    // Game state
    this.score = 0;
    this.isGameOver = false;
    
    // Difficulty settings
    this.difficulties = {
      easy: { 
        speed: 1.2, 
        obstacleInterval: 2500, 
        dataInterval: 1200 
      },
      normal: { 
        speed: 1.5, 
        obstacleInterval: 2000, 
        dataInterval: 1000 
      },
      hard: { 
        speed: 2.0, 
        obstacleInterval: 1500, 
        dataInterval: 800 
      }
    };
    
    // Default settings
    this.difficulty = 'normal';
    this.gameSpeed = 1.5;
    
    // Object management
    this.objectsPool = [];
    this.objectsToRemove = [];
    
    // Game lanes configuration (normalized 0-1)
    this.lanes = [0.2, 0.5, 0.8];
    this.currentLane = 1; // Start in center lane
  }
  
  init(data) {
    // Reset game state
    this.score = 0;
    this.isGameOver = false;
    this.objectsPool = [];
    this.objectsToRemove = [];
    
    // Set difficulty if provided
    if (data && data.difficulty) {
      this.difficulty = data.difficulty;
    }
    
    // Get screen dimensions
    this.gameWidth = data?.gameWidth || this.cameras.main.width;
    this.gameHeight = data?.gameHeight || this.cameras.main.height;
    
    // Set game parameters based on difficulty
    this.gameSpeed = this.difficulties[this.difficulty].speed;
    this.obstacleInterval = this.difficulties[this.difficulty].obstacleInterval;
    this.dataInterval = this.difficulties[this.difficulty].dataInterval;
    
    // Reset TronGrid speed multiplier
    if (this.tronGrid) {
      this.tronGrid.setSpeedMultiplier(1.0);
    }
    
    // Current lane (start in center)
    this.currentLane = 1;
  }
  
  preload() {
    // Create loading visuals
    this.createLoadingUI();
    
    // Load game assets
    this.load.setPath('/assets/images/');
    this.load.image('playerL', 'playerL.png');
    this.load.image('playerR', 'playerR.png');
    this.load.image('playerJ', 'playerJ.png');
    this.load.image('obstacle', 'obstacle.png');
    this.load.image('data', 'data.png');
    
    // Load audio files
    this.load.setPath('/assets/audio/');
    this.load.audio('jump', 'jump.mp3');
    this.load.audio('collect', 'collect.mp3');
    this.load.audio('hit', 'hit.mp3');
    this.load.audio('gameover', 'gameover.mp3');
  }
  
  createLoadingUI() {
    const { width, height } = this.cameras.main;
    
    // Background box
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width * 0.25, height * 0.45, width * 0.5, height * 0.1);
    
    // Progress bar (initially empty)
    const progressBar = this.add.graphics();
    
    // Loading text
    const loadingText = this.add.text(width / 2, height * 0.4, 'Loading...', {
      font: '20px monospace',
      fill: '#ffffff'
    });
    loadingText.setOrigin(0.5, 0.5);
    
    // Loading progress events
    this.load.on('progress', (value) => {
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(width * 0.26, height * 0.46, width * 0.48 * value, height * 0.08);
    });
    
    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
    });
  }
  
  create() {
    // Set game as running (for input handling)
    this.game.isRunning = true;
    
    // Simple audio unlock on first interaction
    this.input.once('pointerdown', () => {
      if (this.sound.locked) {
        this.sound.unlock();
      }
    });
    
    // Set background color
    this.cameras.main.setBackgroundColor(0x0a0e17);
    
    // Create the Tron grid
    this.createTronGrid();
    
    // Create player
    this.createPlayer();
    
    // Setup lanes
    this.setupLaneMovement();
    
    // Setup jump input handlers
    this.input.keyboard.on('keydown-SPACE', this.handleJumpInput, this);
    this.input.on('pointerdown', this.handleJumpInput, this);
    
    // Reset game state
    this.isGameOver = false;
    this.spawnTimer = this.obstacleInterval;
    this.dataSpawnTimer = this.dataInterval;
    
    // Listen for start event
    this.game.events.on('startGame', this.startGame, this);
  }
  
  handleJumpInput() {
    // Only handle jump if game is running and not in game over state
    if (this.game.isRunning && !this.isGameOver && this.player) {
      this.player.jump();
    }
  }
  
  startGame() {
    // Try to unlock audio
    if (this.sound.locked) {
      this.sound.unlock();
    }
    
    // Populate initial objects
    this.populateInitialObjects();
    
    // Setup speed increase timer
    this.setupSpeedIncrease();
  }
  
  createTronGrid() {
    if (this.tronGrid) {
      this.tronGrid.destroy();
    }
    
    this.tronGrid = new TronGrid(this, {
      horizonY: this.gameHeight * 0.35,
      gridWidth: this.gameWidth * 0.8,
      gridWidthAtHorizon: 60,
      baseColor: 0x4f46e5,    // Purple
      accentColor: 0xf472b6,  // Pink
      thirdColor: 0x34d399,   // Green
      lineAlpha: 0.8,
      horizontalLines: 20,
      verticalLines: 10,
      scrollSpeed: 2,
      lineWidth: 2,
      colorCycleSpeed: 0.0005
    });
  }
  
  createPlayer() {
    // Player position
    const playerX = this.gameWidth / 2;
    const playerY = this.gameHeight - 155;
    
    // Create player
    this.player = new Player(this, playerX, playerY, {
      hasGlowEffect: false
    });
    
    // Set player to center lane
    this.time.delayedCall(50, () => {
      if (this.player && this.player.container) {
        this.movePlayerToLane(1);
      }
    });
  }
  
  setupLaneMovement() {
    // Setup lane movement controls
    this.input.keyboard.on('keydown-LEFT', this.moveLeft, this);
    this.input.keyboard.on('keydown-RIGHT', this.moveRight, this);
    
    // For mobile swipe controls
    this.input.on('pointerdown', this.startSwipe, this);
    this.input.on('pointerup', this.endSwipe, this);
  }
  
  startSwipe(pointer) {
    this.swipeStartX = pointer.x;
  }
  
  endSwipe(pointer) {
    if (!this.swipeStartX) return;
    
    const swipeDistance = pointer.x - this.swipeStartX;
    const swipeThreshold = 50;
    
    if (swipeDistance < -swipeThreshold) {
      this.moveLeft();
    } else if (swipeDistance > swipeThreshold) {
      this.moveRight();
    }
    
    // Reset swipe start
    this.swipeStartX = null;
  }
  
  populateInitialObjects() {
    for (let i = 0; i < 10; i++) {
      const z = 200 + (i * 100);
      if (i % 3 === 0) {
        this.spawnObstacleAtDistance(z);
      } else {
        this.spawnCollectibleAtDistance(z);
      }
    }
  }
  
  setupSpeedIncrease() {
    this.time.addEvent({
      delay: 10000, // 10 seconds
      callback: this.increaseSpeed,
      callbackScope: this,
      loop: true
    });
  }
  
  // Handle resize
  handleResize(width, height) {
    // Update stored dimensions
    this.gameWidth = width;
    this.gameHeight = height;
    
    // Recreate the TronGrid with new dimensions
    this.createTronGrid();
    
    // Update player position if it exists
    if (this.player) {
      // Update player's ground position
      const playerY = height - 155;
      this.player.startY = playerY;
      if (this.player.container) {
        this.player.container.y = playerY;
      }
      
      // Update player glow
      if (this.player.glow) {
        this.player.glow.y = playerY + 15;
      }
      
      // Ensure player is in correct lane
      this.movePlayerToLane(this.currentLane);
    }
  }
  
  movePlayerToLane(laneIndex) {
    if (!this.player || !this.player.container || !this.tronGrid) return;
    
    // Validate lane index
    if (laneIndex < 0 || laneIndex >= this.lanes.length) {
      return;
    }
    
    // Update current lane
    this.currentLane = laneIndex;
    
    // Use fixed Y position if container isn't fully initialized yet
    const playerY = this.player.container.y || (this.gameHeight - 155);
    
    // Calculate lane position with perspective
    const perspectiveRatio = (playerY - this.tronGrid.config.horizonY) / 
                            (this.gameHeight - this.tronGrid.config.horizonY);
    const roadWidth = this.tronGrid.config.gridWidthAtHorizon + 
                     (this.tronGrid.config.gridWidth - this.tronGrid.config.gridWidthAtHorizon) * 
                     perspectiveRatio;
    const roadLeft = (this.gameWidth - roadWidth) / 2;
    const lanePosition = this.lanes[laneIndex];
    const targetX = roadLeft + roadWidth * lanePosition;
    
    // Move the player
    if (this.player.moveTo && typeof this.player.moveTo === 'function') {
      this.player.moveTo(laneIndex, targetX);
    } else {
      // Fallback if moveTo doesn't exist
      this.tweens.add({
        targets: this.player.container,
        x: targetX,
        duration: 200,
        ease: 'Sine.easeInOut'
      });
    }
  }
  
  update(time, delta) {
    if (this.isGameOver) return;
    
    // Store current lane to protect against accidental changes
    const savedLane = this.currentLane;
    
    // Update the Tron grid
    if (this.tronGrid) {
      this.tronGrid.update(delta);
    }
    
    // Spawn timers
    this.updateSpawnTimers(delta);
    
    // Update and check objects
    this.updateObjects(delta);
    
    // Clean up objects marked for removal
    this.cleanupObjects();
    
    // Ensure lane position wasn't accidentally changed
    if (this.currentLane !== savedLane) {
      this.currentLane = savedLane;
      this.movePlayerToLane(savedLane);
    }
  }
  
  updateSpawnTimers(delta) {
    // Obstacle spawn timer
    this.spawnTimer -= delta;
    if (this.spawnTimer <= 0) {
      this.spawnObstacle();
      this.spawnTimer = this.obstacleInterval;
    }
    
    // Data collectible spawn timer
    this.dataSpawnTimer -= delta;
    if (this.dataSpawnTimer <= 0) {
      this.spawnCollectible();
      this.dataSpawnTimer = this.dataInterval;
    }
  }
  
  updateObjects(delta) {
    // Skip if no objects
    if (!Array.isArray(this.objectsPool) || this.objectsPool.length === 0) {
      return;
    }
    
    // Process each object in the pool
    for (let i = 0; i < this.objectsPool.length; i++) {
      const obj = this.objectsPool[i];
      
      // Skip invalid objects
      if (!obj || obj.destroyed) continue;
      
      // Skip collected objects
      if (obj.type === 'collectible' && obj.collected) {
        continue;
      }
      
      // Update z position (move closer to camera)
      obj.z -= this.gameSpeed * (delta / 16.667);
      
      // If passed camera, mark for removal
      if (obj.z <= 0) {
        if (obj.sprite) {
          obj.sprite.destroy();
        }
        this.objectsToRemove.push(obj);
        continue;
      }
      
      // Update visual position and size
      this.updateObjectVisuals(obj);
      
      // Check for collisions in the detection zone
      if (obj.z < 50 && obj.z > 30) {
        this.checkObjectCollision(obj);
      }
    }
  }
  
  cleanupObjects() {
    // Remove objects that are marked for removal
    if (this.objectsToRemove.length > 0) {
      this.objectsPool = this.objectsPool.filter(obj => 
        !this.objectsToRemove.includes(obj)
      );
      this.objectsToRemove = [];
    }
  }
  
  checkObjectCollision(obj) {
    // Calculate lane of object
    const objLaneIndex = Math.round(obj.lane * (this.lanes.length - 1));
    
    // Check if player is in same lane
    if (objLaneIndex === this.currentLane) {
      if (obj.type === 'collectible' && !obj.collected) {
        this.collectData(obj);
      } else if (obj.type === 'obstacle' && !this.player.isJumping && !obj.hit) {
        this.hitObstacle(obj);
      }
    }
  }
  
  moveLeft() {
    if (this.isGameOver) return;
    
    // Check if we can move left
    if (this.currentLane > 0) {
      this.currentLane--;
      this.movePlayerToLane(this.currentLane);
    }
  }
  
  moveRight() {
    if (this.isGameOver) return;
    
    // Check if we can move right
    if (this.currentLane < this.lanes.length - 1) {
      this.currentLane++;
      this.movePlayerToLane(this.currentLane);
    }
  }
  
  spawnObstacle() {
    this.spawnObstacleAtDistance(1000);
  }
  
  spawnObstacleAtDistance(z) {
    if (!this.tronGrid) return;
    
    // Random lane
    const laneIndex = Math.floor(Math.random() * this.lanes.length);
    const lane = this.lanes[laneIndex];
    
    // Calculate initial visual position based on perspective
    const ratio = 40 / z;
    const y = this.tronGrid.config.horizonY + 
             (this.gameHeight - this.tronGrid.config.horizonY) * ratio;
    
    // Calculate x position
    const perspectiveRatio = (y - this.tronGrid.config.horizonY) / 
                           (this.gameHeight - this.tronGrid.config.horizonY);
    const roadWidth = this.tronGrid.config.gridWidthAtHorizon + 
                     (this.tronGrid.config.gridWidth - this.tronGrid.config.gridWidthAtHorizon) * 
                     perspectiveRatio;
    const roadLeft = (this.gameWidth - roadWidth) / 2;
    const x = roadLeft + roadWidth * lane;
    
    // Create sprite
    let sprite;
    if (this.textures.exists('obstacle')) {
      sprite = this.add.sprite(x, y, 'obstacle');
      sprite.setTint(0xef4444);
    } else {
      sprite = this.add.rectangle(x, y, 10, 5, 0xef4444);
    }
    
    // Set depth
    sprite.setDepth(30);
    
    // Add to object pool
    const obstacle = {
      type: 'obstacle',
      sprite: sprite,
      lane: laneIndex / (this.lanes.length - 1), // Normalize to 0-1
      z: z,
      baseWidth: Math.min(this.gameHeight * 0.15, this.gameWidth * 0.2),
      baseHeight: Math.min(this.gameHeight * 0.15, this.gameWidth * 0.2),
      hit: false,
      destroyed: false
    };
    
    if (Array.isArray(this.objectsPool)) {
      this.objectsPool.push(obstacle);
    }
    
    // Initialize visuals
    this.updateObjectVisuals(obstacle);
  }
  
  spawnCollectible() {
    this.spawnCollectibleAtDistance(1000);
  }
  
  spawnCollectibleAtDistance(z) {
    if (!this.tronGrid) return;
    
    // Random lane
    const laneIndex = Math.floor(Math.random() * this.lanes.length);
    const lane = this.lanes[laneIndex];
    
    // Calculate visual position
    const ratio = 40 / z;
    const y = this.tronGrid.config.horizonY + 
             (this.gameHeight - this.tronGrid.config.horizonY) * ratio;
    
    // Calculate x position
    const perspectiveRatio = (y - this.tronGrid.config.horizonY) / 
                           (this.gameHeight - this.tronGrid.config.horizonY);
    const roadWidth = this.tronGrid.config.gridWidthAtHorizon + 
                     (this.tronGrid.config.gridWidth - this.tronGrid.config.gridWidthAtHorizon) * 
                     perspectiveRatio;
    const roadLeft = (this.gameWidth - roadWidth) / 2;
    const x = roadLeft + roadWidth * lane;
    
    // Create sprite
    let sprite;
    if (this.textures.exists('data')) {
      sprite = this.add.sprite(x, y, 'data');
      sprite.setTint(0x38bdf8);
    } else {
      sprite = this.add.rectangle(x, y, 8, 8, 0x38bdf8);
    }
    
    // Set depth
    sprite.setDepth(30);
    
    // Add pulse animation
    this.tweens.add({
      targets: sprite,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 500,
      yoyo: true,
      repeat: -1
    });
    
    // Add to object pool
    const collectible = {
      type: 'collectible',
      sprite: sprite,
      lane: laneIndex / (this.lanes.length - 1),
      z: z,
      baseWidth: Math.min(this.gameHeight * 0.12, this.gameWidth * 0.12),
      baseHeight: Math.min(this.gameHeight * 0.12, this.gameWidth * 0.12),
      collected: false,
      destroyed: false
    };
    
    if (Array.isArray(this.objectsPool)) {
      this.objectsPool.push(collectible);
    }
    
    // Initialize visuals
    this.updateObjectVisuals(collectible);
  }
  
  updateObjectVisuals(obj) {
    if (!obj || !obj.sprite || !this.tronGrid || obj.destroyed) return;
    if (obj.type === 'collectible' && obj.collected) return;
    
    // Calculate perspective ratio
    const ratio = 40 / obj.z;
    
    // Calculate perspective coordinates
    const y = this.tronGrid.config.horizonY + 
             (this.gameHeight - this.tronGrid.config.horizonY) * ratio;
    
    // Calculate road width at this position
    const perspectiveRatio = (y - this.tronGrid.config.horizonY) / 
                            (this.gameHeight - this.tronGrid.config.horizonY);
    const roadWidth = this.tronGrid.config.gridWidthAtHorizon + 
                     (this.tronGrid.config.gridWidth - this.tronGrid.config.gridWidthAtHorizon) * 
                     perspectiveRatio;
    const roadLeft = (this.gameWidth - roadWidth) / 2;
    
    // Calculate x position based on lane
    const laneIndex = Math.round(obj.lane * (this.lanes.length - 1));
    const lanePosition = this.lanes[laneIndex];
    const x = roadLeft + roadWidth * lanePosition;
    
    // Update position
    obj.sprite.x = x;
    obj.sprite.y = y;
    
    // Update size based on distance
    const scale = ratio * 3.0;
    obj.sprite.displayWidth = obj.baseWidth * scale;
    obj.sprite.displayHeight = obj.baseHeight * scale;
    
    // Adjust alpha for distance
    obj.sprite.alpha = Math.min(1, ratio * 2);
  }
  
  collectData(obj) {
    // Prevent double collection and validate object
    if (!obj || !obj.sprite || obj.collected || obj.destroyed) return;
    
    // Mark as collected
    obj.collected = true;
    
    // Add to removal list
    if (!this.objectsToRemove.includes(obj)) {
      this.objectsToRemove.push(obj);
    }
    
    // Play collect sound
    this.sound.play('collect');
    
    // Update internal score
    this.score += 10;
    
    // Emit event to React
    if (this.game && this.game.events) {
      this.game.events.emit('updateScore', 10);
    }
    
    // Hide sprite
    if (obj.sprite) {
      obj.sprite.visible = false;
    }
    
    // Create effect
    this.createCollectParticles(obj.sprite.x, obj.sprite.y);
    
    // Schedule sprite destruction
    this.time.delayedCall(50, () => {
      if (obj.sprite && !obj.sprite.destroyed) {
        obj.sprite.destroy();
        obj.sprite = null;
      }
    });
  }
  
  createCollectParticles(x, y) {
    // Calculate particle size based on screen
    const particleSize = Math.max(2, Math.min(this.gameWidth, this.gameHeight) * 0.01);
    
    // Create particles
    for (let i = 0; i < 15; i++) {
      const particle = this.add.circle(x, y, particleSize, 0x38bdf8);
      particle.setAlpha(0.7);
      particle.setDepth(40);
      
      this.tweens.add({
        targets: particle,
        x: x + Phaser.Math.Between(-100, 100),
        y: y + Phaser.Math.Between(-100, 100),
        alpha: 0,
        scale: 0,
        duration: 500,
        onComplete: () => {
          particle.destroy();
        }
      });
    }
    
    // Add score popup
    const fontSize = Math.max(20, Math.min(this.gameWidth, this.gameHeight) * 0.04);
    const scorePopup = this.add.text(x, y - 20, '+10', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: `${fontSize}px`,
      color: '#38bdf8'
    }).setOrigin(0.5);
    scorePopup.setDepth(45);
    
    // Animate popup
    this.tweens.add({
      targets: scorePopup,
      y: y - 600,
      alpha: 0,
      duration: 800,
      onComplete: () => {
        scorePopup.destroy();
      }
    });
  }
  
  hitObstacle(obj) {
    if (this.isGameOver || !obj || !obj.sprite || obj.hit) return;
    
    // Mark as hit to prevent multiple hits
    obj.hit = true;
    this.isGameOver = true;
    
    // Play hit sound
    this.sound.play('hit');
    
    // Play game over sound after short delay
    this.time.delayedCall(500, () => {
      this.sound.play('gameover');
    });
    
    // Flash player
    if (this.player) {
      this.tweens.add({
        targets: this.player.container,
        alpha: 0,
        duration: 100,
        yoyo: true,
        repeat: 5
      });
    }
    
    // Create crash effect
    this.createCrashEffect(obj.sprite.x, obj.sprite.y);
    
    // Emit game over event
    if (this.game && this.game.events) {
      this.game.events.emit('gameOver', this.score);
    }
    
    // Pause the scene after a short delay
    this.time.delayedCall(2000, () => {
      this.tweens.killAll();
      this.game.isRunning = false;
      this.scene.pause();
    });
  }
  
  createCrashEffect(x, y) {
    // Calculate effect sizes based on screen
    const particleSize = Math.max(3, Math.min(this.gameWidth, this.gameHeight) * 0.015);
    const explosionSize = Math.min(this.gameWidth, this.gameHeight) * 0.15;
    
    // Create explosion particles
    for (let i = 0; i < 30; i++) {
      const particle = this.add.circle(
        x, 
        y, 
        Phaser.Math.Between(particleSize, particleSize * 2), 
        0xef4444
      );
      particle.setDepth(60);
      
      this.tweens.add({
        targets: particle,
        x: x + Phaser.Math.Between(-150, 150),
        y: y + Phaser.Math.Between(-150, 150),
        alpha: 0,
        scale: { from: 1, to: 0 },
        duration: Phaser.Math.Between(500, 1000),
        onComplete: () => {
          particle.destroy();
        }
      });
    }
    
    // Add main explosion
    const explosion = this.add.circle(x, y, explosionSize, 0xef4444, 0.7);
    explosion.setDepth(55);
    
    this.tweens.add({
      targets: explosion,
      scale: 2,
      alpha: 0,
      duration: 500,
      onComplete: () => {
        explosion.destroy();
      }
    });
    
    // Add screen shake
    this.cameras.main.shake(300, 0.01);
  }
  
  increaseSpeed() {
    // Only increase up to a maximum
    if (this.gameSpeed < 5) {
      this.gameSpeed += 0.2;
      
      // Update the grid's speed multiplier when game speed changes
      if (this.tronGrid) {
        // Calculate a multiplier based on the starting and current speeds
        const startingSpeed = this.difficulties[this.difficulty].speed;
        const multiplier = this.gameSpeed / startingSpeed;
        this.tronGrid.setSpeedMultiplier(multiplier);
      }
    }
  }
  
  // Cleanup when scene shuts down
  shutdown() {
    // Remove input handlers
    this.input.keyboard.off('keydown-LEFT', this.moveLeft, this);
    this.input.keyboard.off('keydown-RIGHT', this.moveRight, this);
    this.input.keyboard.off('keydown-SPACE', this.handleJumpInput, this);
    this.input.off('pointerdown', this.startSwipe, this);
    this.input.off('pointerup', this.endSwipe, this);
    this.input.off('pointerdown', this.handleJumpInput, this);
    
    // Mark game as not running
    if (this.game) {
      this.game.isRunning = false;
    }
    
    // Call parent
    super.shutdown();
  }
}