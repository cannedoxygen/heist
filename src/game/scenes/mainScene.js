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
    this.isGridCreated = false;
    
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
    this.lanes = [0.25, 0.5, 0.75];
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
    this.loadGameAssets();
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
  
  loadGameAssets() {
    // Set path for images
    this.load.setPath('/assets/images/');
    
    try {
      // Load player character sprites with correct names
      this.load.image('playerL', 'playerL.png');
      this.load.image('playerR', 'playerR.png');
      this.load.image('playerJ', 'playerJ.png');
      
      // Load other game assets
      this.load.image('obstacle', 'obstacle.png');
      this.load.image('data', 'data.png');
    } catch (e) {
      console.warn('Error loading sprite assets:', e);
    }
    
    // Load audio
    this.load.setPath('/assets/audio/');
    
    try {
      this.load.audio('jump', 'jump.mp3');
      this.load.audio('collect', 'collect.mp3');
      this.load.audio('hit', 'hit.mp3');
      this.load.audio('gameover', 'gameover.mp3');
    } catch (e) {
      console.warn('Error loading audio assets:', e);
    }
  }
  
  create() {
    // Set game as running (for input handling in Player class)
    this.game.isRunning = true;
    
    // Set background color
    this.cameras.main.setBackgroundColor(0x0a0e17);
    
    // Create the Tron grid first - fixes resize issue
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
    
    // Wait to add initial objects until the game actually starts
    // This prevents objects from appearing during the start overlay
  }
  
  handleJumpInput() {
    // Only handle jump if game is running and not in game over state
    if (this.game.isRunning && !this.isGameOver && this.player) {
      this.player.jump();
    }
  }
  
  startGame() {
    // Add initial objects only when game starts
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
    
    this.isGridCreated = true;
  }
  
  createPlayer() {
    // Player position
    const playerX = this.gameWidth / 2;
    // Position player higher up (changed from -80 to -120)
    const playerY = this.gameHeight - 120;
    
    try {
      // Create player using our enhanced Player class
      this.player = new Player(this, playerX, playerY, {
        hasGlowEffect: false // Disable the glow effect
      });
      
      // Add a small delay to ensure player is properly initialized
      this.time.delayedCall(50, () => {
        // Set player to center lane
        if (this.player && this.player.container) {
          this.movePlayerToLane(1);
        }
      });
    } catch (error) {
      console.error('Error creating player:', error);
    }
  }
  
  setupLaneMovement() {
    // Setup lane movement controls (left/right only)
    this.input.keyboard.on('keydown-LEFT', this.moveLeft, this);
    this.input.keyboard.on('keydown-RIGHT', this.moveRight, this);
    
    // For mobile swipe controls (for lane changes only)
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
  
  // Handle resize - fixes grid adjustment issue
  handleResize(width, height) {
    // Update stored dimensions
    this.gameWidth = width;
    this.gameHeight = height;
    
    // Recreate the TronGrid with new dimensions
    this.createTronGrid();
    
    // Update player position if it exists
    if (this.player) {
      // Update player's ground position - adjusted higher
      const playerY = height - 120; // Changed from 80 to 120
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
    // Add more defensive checks
    if (!this.player) return;
    if (!this.player.container) return;
    if (!this.tronGrid) return;
    
    // Validate lane index
    if (laneIndex < 0 || laneIndex >= this.lanes.length) {
      return;
    }
    
    // Update current lane
    this.currentLane = laneIndex;
    
    // Use fixed Y position if container isn't fully initialized yet
    const playerY = this.player.container.y || (this.gameHeight - 120);
    
    // Calculate lane position with perspective
    const perspectiveRatio = (playerY - this.tronGrid.config.horizonY) / 
                            (this.gameHeight - this.tronGrid.config.horizonY);
    const roadWidth = this.tronGrid.config.gridWidthAtHorizon + 
                     (this.tronGrid.config.gridWidth - this.tronGrid.config.gridWidthAtHorizon) * 
                     perspectiveRatio;
    const roadLeft = (this.gameWidth - roadWidth) / 2;
    const lanePosition = this.lanes[laneIndex];
    const targetX = roadLeft + roadWidth * lanePosition;
    
    // Move the player (using the Player's moveTo method if it exists)
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
    
    // IMPORTANT: Ensure lane position wasn't accidentally changed
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
      
      // Skip collected objects - don't mark them for removal yet, just skip processing
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
      baseWidth: Math.min(this.gameHeight * 0.15, this.gameWidth * 0.2) * 1.5,
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
      baseWidth: Math.min(this.gameHeight * 0.08, this.gameWidth * 0.08),
      baseHeight: Math.min(this.gameHeight * 0.08, this.gameWidth * 0.08),
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
    
    // Store the current lane before any operations
    const currentLane = this.currentLane;
    
    try {
      // Mark as collected immediately to prevent duplicate processing
      obj.collected = true;
      
      // Add to removal list
      if (!this.objectsToRemove.includes(obj)) {
        this.objectsToRemove.push(obj);
      }
      
      // Play sound
      if (this.sound && this.sound.get('collect')) {
        this.sound.play('collect', { volume: 0.5 });
      }
      
      // Update internal score
      this.score += 10;
      
      // Emit event to React
      try {
        if (this.game && this.game.events) {
          this.game.events.emit('updateScore', 10);
        }
      } catch (error) {
        console.error('Error emitting score update event:', error);
      }
      
      // Hide sprite but don't destroy immediately
      if (obj.sprite) {
        obj.sprite.visible = false;
      }
      
      // Create effect
      this.createCollectParticles(obj.sprite.x, obj.sprite.y);
      
      // Schedule sprite destruction after a short delay
      this.time.delayedCall(50, () => {
        try {
          if (obj.sprite && !obj.sprite.destroyed) {
            obj.sprite.destroy();
            obj.sprite = null;
          }
        } catch (e) {
          console.error('Error destroying sprite:', e);
        }
      });
    } catch (error) {
      console.error('Error in collectData:', error);
    } finally {
      // Always ensure lane position remains unchanged
      this.currentLane = currentLane;
    }
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
    
    // Play sound effects
    if (this.sound && this.sound.get('hit')) {
      this.sound.play('hit', { volume: 0.7 });
    }
    
    if (this.sound && this.sound.get('gameover')) {
      this.time.delayedCall(500, () => {
        this.sound.play('gameover', { volume: 0.5 });
      });
    }
    
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
    
    // Emit game over event once
    try {
      if (this.game && this.game.events) {
        this.game.events.emit('gameOver', this.score);
      }
    } catch (error) {
      console.error('Error emitting game over event:', error);
    }
    
    // Don't transition to GameOverScene - let React handle this
    // Just pause the game after a short delay
    this.time.delayedCall(2000, () => {
      try {
        this.tweens.killAll();
        
        // Mark game as not running (for Player input handling)
        this.game.isRunning = false;
        
        // Pause the scene
        this.scene.pause();
      } catch (error) {
        console.error('Error pausing scene:', error);
      }
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
    
    // Mark game as not running (for Player input handling)
    if (this.game) {
      this.game.isRunning = false;
    }
    
    // Call parent
    super.shutdown();
  }
}