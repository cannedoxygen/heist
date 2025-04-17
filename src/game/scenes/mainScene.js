import Phaser from 'phaser';
import { TronGrid } from '../TronGrid';

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
    
    // Current lane (start in center)
    this.currentLane = 1;
  }
  
  // Handle resize events
  handleResize(width, height) {
    // Update stored dimensions
    this.gameWidth = width;
    this.gameHeight = height;
    
    // Recreate the TronGrid with new dimensions
    if (this.tronGrid) {
      this.tronGrid.destroy();
      this.tronGrid = this.createTronGrid();
    }
    
    // Update player position
    if (this.player) {
      const playerY = height - 80;
      this.player.y = playerY;
      
      // Update player glow
      if (this.playerGlow) {
        this.playerGlow.y = playerY + 20;
      }
      
      // Ensure player is in correct lane
      this.movePlayerToLane(this.currentLane);
    }
  }
  
  preload() {
    // Create loading visuals
    this.createLoadingUI();
    
    // Load game assets
    this.loadGameAssets();
  }
  
  createLoadingUI() {
    const width = this.gameWidth;
    const height = this.gameHeight;
    
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
    // Try to load images
    this.load.setPath('/assets/images/');
    
    try {
      this.load.image('player', 'player.png');
      this.load.image('obstacle', 'obstacle.png');
      this.load.image('data', 'data.png');
    } catch (e) {
      // Fallback created during create()
    }
    
    // Load audio
    this.load.setPath('/assets/audio/');
    
    try {
      this.load.audio('jump', 'jump.mp3');
      this.load.audio('collect', 'collect.mp3');
      this.load.audio('hit', 'hit.mp3');
      this.load.audio('gameover', 'gameover.mp3');
    } catch (e) {
      // Continue silently - audio is optional
    }
  }
  
  // Create fallback assets when images fail to load
  createFallbackAssets() {
    // Scale asset sizes based on screen dimensions
    const playerSize = Math.min(this.gameHeight * 0.2, this.gameWidth * 0.15);
    const obstacleWidth = playerSize * 1.5; 
    const obstacleHeight = playerSize;
    const collectibleSize = playerSize * 0.5;
  
    // Create fallback textures using graphics
    this.createFallbackTexture('player', playerSize, playerSize, 0x4f46e5);
    this.createFallbackTexture('obstacle', obstacleWidth, obstacleHeight, 0xef4444);
    this.createFallbackTexture('data', collectibleSize, collectibleSize, 0x38bdf8);
  }
  
  createFallbackTexture(name, width, height, color) {
    if (!this.textures.exists(name)) {
      const graphics = this.make.graphics({ x: 0, y: 0, add: false });
      graphics.fillStyle(color, 1);
      graphics.fillRect(0, 0, width, height);
      graphics.generateTexture(name, width, height);
      graphics.destroy();
    }
  }
  
  create() {
    // Ensure we have dimensions
    this.gameWidth = this.gameWidth || this.cameras.main.width;
    this.gameHeight = this.gameHeight || this.cameras.main.height;
    
    // Create fallback assets if needed
    this.createFallbackAssets();
    
    // Create the Tron grid
    this.tronGrid = this.createTronGrid();
    
    // Set background color
    this.cameras.main.setBackgroundColor(0x0a0e17);
    
    // Create player
    this.createPlayer();
    
    // Setup input
    this.setupInputHandlers();
    
    // Reset game state
    this.isGameOver = false;
    this.spawnTimer = this.obstacleInterval;
    this.dataSpawnTimer = this.dataInterval;
    
    // Add initial objects
    this.populateInitialObjects();
    
    // Setup speed increase timer
    this.setupSpeedIncrease();
  }
  
  createTronGrid() {
    return new TronGrid(this, {
      horizonY: this.gameHeight * 0.35,
      gridWidth: this.gameWidth * 0.8,
      gridWidthAtHorizon: 60,
      color: 0x4f46e5,
      lineAlpha: 0.8,
      horizontalLines: 20,
      verticalLines: 10,
      scrollSpeed: 2,
      lineWidth: 2
    });
  }
  
  createPlayer() {
    // Player position
    const playerX = this.gameWidth / 2;
    const playerY = this.gameHeight - 80;
    
    // Calculate player size based on screen
    const size = Math.min(this.gameHeight * 0.2, this.gameWidth * 0.15);
    
    // Create player sprite or shape
    if (this.textures.exists('player')) {
      this.player = this.add.sprite(playerX, playerY, 'player');
      this.player.setDisplaySize(size, size);
    } else {
      this.player = this.add.rectangle(playerX, playerY, size, size, 0x4f46e5);
    }
    
    // Setup player properties
    this.player.setDepth(50);
    this.player.isJumping = false;
    this.player.jumpHeight = this.gameHeight * 0.15;
    this.player.jumpDuration = 500;
    
    // Add glow effect
    this.playerGlow = this.add.ellipse(
      playerX,
      playerY + 20,
      size * 1.5,
      size * 0.5,
      0x4f46e5,
      0.4
    );
    this.playerGlow.setDepth(45);
    
    // Create pulsing effect
    this.tweens.add({
      targets: this.playerGlow,
      alpha: { from: 0.4, to: 0.6 },
      scale: { from: 1, to: 1.1 },
      duration: 1000,
      yoyo: true,
      repeat: -1
    });
    
    // Set player to center lane
    this.movePlayerToLane(1);
  }
  
  setupInputHandlers() {
    // Jump controls
    this.input.on('pointerdown', this.jump, this);
    this.input.keyboard.on('keydown-SPACE', this.jump, this);
    
    // Movement controls
    this.cursors = this.input.keyboard.createCursorKeys();
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
  
  update(time, delta) {
    if (this.isGameOver) return;
    
    // Store current lane to protect against accidental changes
    const savedLane = this.currentLane;
    
    // Update the Tron grid
    if (this.tronGrid) {
      this.tronGrid.update(delta);
    }
    
    // Update player glow position
    if (this.playerGlow && this.player) {
      this.playerGlow.x = this.player.x;
      this.playerGlow.y = this.player.y + 20;
    }
    
    // Handle keyboard input
    this.handleKeyboardInput();
    
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
  
  handleKeyboardInput() {
    if (this.cursors) {
      if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
        this.moveLeft();
      } else if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
        this.moveRight();
      }
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
  
  jump() {
    if (this.isGameOver || !this.player || this.player.isJumping) return;
    
    // Set jumping flag
    this.player.isJumping = true;
    
    // Play jump sound
    if (this.sound && this.sound.get('jump')) {
      this.sound.play('jump', { volume: 0.5 });
    }
    
    // Create jump tween for player
    this.tweens.add({
      targets: this.player,
      y: this.player.y - this.player.jumpHeight,
      duration: this.player.jumpDuration / 2,
      ease: 'Sine.easeOut',
      yoyo: true,
      onComplete: () => {
        if (this.player) {
          this.player.isJumping = false;
        }
      }
    });
    
    // Move glow with player
    if (this.playerGlow) {
      this.tweens.add({
        targets: this.playerGlow,
        y: this.playerGlow.y - this.player.jumpHeight,
        duration: this.player.jumpDuration / 2,
        ease: 'Sine.easeOut',
        yoyo: true
      });
    }
    
    // Create jump effect
    this.createJumpEffect();
  }
  
  createJumpEffect() {
    if (!this.player) return;
    
    // Create a visual jump effect
    const jumpEffect = this.add.ellipse(
      this.player.x,
      this.player.y + 35,
      this.player.displayWidth * 1.2,
      this.player.displayHeight * 0.3,
      0x4f46e5,
      0.6
    );
    jumpEffect.setDepth(40);
    
    // Animate and destroy
    this.tweens.add({
      targets: jumpEffect,
      scaleX: 1.5,
      scaleY: 0.5,
      alpha: 0,
      duration: 300,
      onComplete: () => {
        jumpEffect.destroy();
      }
    });
  }
  
  moveLeft() {
    if (this.isGameOver || !this.player) return;
    
    // Check if we can move left
    if (this.currentLane > 0) {
      this.currentLane--;
      this.movePlayerToLane(this.currentLane);
    }
  }
  
  moveRight() {
    if (this.isGameOver || !this.player) return;
    
    // Check if we can move right
    if (this.currentLane < this.lanes.length - 1) {
      this.currentLane++;
      this.movePlayerToLane(this.currentLane);
    }
  }
  
  movePlayerToLane(laneIndex) {
    if (!this.player || !this.tronGrid) return;
    
    // Validate lane index
    if (laneIndex < 0 || laneIndex >= this.lanes.length) {
      return;
    }
    
    // Calculate lane position with perspective
    const playerY = this.player.y;
    const perspectiveRatio = (playerY - this.tronGrid.config.horizonY) / 
                            (this.gameHeight - this.tronGrid.config.horizonY);
    const roadWidth = this.tronGrid.config.gridWidthAtHorizon + 
                     (this.tronGrid.config.gridWidth - this.tronGrid.config.gridWidthAtHorizon) * 
                     perspectiveRatio;
    const roadLeft = (this.gameWidth - roadWidth) / 2;
    const lanePosition = this.lanes[laneIndex];
    const targetX = roadLeft + roadWidth * lanePosition;
    
    // Stop any existing movement tweens
    this.tweens.killTweensOf(this.player);
    if (this.playerGlow) {
      this.tweens.killTweensOf(this.playerGlow);
    }
    
    // Create movement tween
    this.tweens.add({
      targets: this.player,
      x: targetX,
      duration: 200,
      ease: 'Sine.easeInOut'
    });
    
    // Move glow with player
    if (this.playerGlow) {
      this.tweens.add({
        targets: this.playerGlow,
        x: targetX,
        duration: 200,
        ease: 'Sine.easeInOut'
      });
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
  
  // THIS IS THE CRITICAL FUNCTION THAT NEEDS FIXING
  collectData(obj) {
    // CRITICAL: Prevent double collection and validate object
    if (!obj || !obj.sprite || obj.collected || obj.destroyed) return;
    
    // Store the current lane before any operations
    const currentLane = this.currentLane;
    
    try {
      // Mark as collected immediately to prevent duplicate processing
      obj.collected = true;
      
      // Don't mark as destroyed yet - wait until cleanup phase
      // obj.destroyed = true; <-- THIS IS THE LINE THAT CAUSES PROBLEMS
      
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
      
      // Emit event to React - CRITICAL: Use try/catch
      try {
        if (this.game && this.game.events) {
          this.game.events.emit('updateScore', 10);
        }
      } catch (error) {
        console.error('Error emitting score update event:', error);
        // Continue execution even if event emission fails
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
      y: y - 120,
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
        targets: this.player,
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
    
    // Switch to game over scene after delay
    this.time.delayedCall(2000, () => {
      try {
        this.tweens.killAll();
        this.scene.start('GameOverScene', { score: this.score });
      } catch (error) {
        console.error('Error transitioning to GameOverScene:', error);
        // Forcibly restart the game if transition fails
        this.scene.start('MainScene');
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
    }
  }
}

export default MainScene;