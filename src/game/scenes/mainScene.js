// src/game/scenes/mainScene.js
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
    
    // Current difficulty
    this.difficulty = 'normal';
    
    // Game speed (controls how fast objects approach)
    this.gameSpeed = 1.5;
    
    // Spawn timers
    this.spawnTimer = 0;
    this.dataSpawnTimer = 0;
    
    // Z-distance of objects (used for 3D perspective)
    this.objectsPool = [];
    
    // Game lanes settings (normalized from 0 to 1 for perspective scaling)
    this.lanes = [0.25, 0.5, 0.75]; // Left, Center, Right (as percentage of road width)
    
    // For road markers
    this.markers = [];
  }
  
  init(data) {
    // Reset game state
    this.score = 0;
    this.isGameOver = false;
    this.objectsPool = [];
    
    // Set difficulty if provided
    if (data && data.difficulty) {
      this.difficulty = data.difficulty;
    }
    
    // Get game dimensions from data or from game instance
    if (data && data.gameWidth && data.gameHeight) {
      this.gameWidth = data.gameWidth;
      this.gameHeight = data.gameHeight;
    } else if (this.game.gameWidth && this.game.gameHeight) {
      this.gameWidth = this.game.gameWidth;
      this.gameHeight = this.game.gameHeight;
    } else {
      // Fallback dimensions if nothing provided
      this.gameWidth = this.cameras.main.width;
      this.gameHeight = this.cameras.main.height;
    }
    
    console.log("MainScene initialized with dimensions:", this.gameWidth, "x", this.gameHeight);
    
    // Set game parameters based on difficulty
    this.gameSpeed = this.difficulties[this.difficulty].speed;
    this.obstacleInterval = this.difficulties[this.difficulty].obstacleInterval;
    this.dataInterval = this.difficulties[this.difficulty].dataInterval;
    
    // Current lane (start in center)
    this.currentLane = 1;
  }
  
  // Handle resize events
  handleResize(width, height) {
    this.gameWidth = width;
    this.gameHeight = height;
    
    console.log("MainScene handling resize to:", width, "x", height);
    
    // Update UI elements positions if they exist
    if (this.scoreText) {
      this.scoreText.setPosition(20, 20);
    }
    
    if (this.difficultyText) {
      this.difficultyText.setPosition(width - 20, 20);
    }
    
    // Recreate the TronGrid with new dimensions
    if (this.tronGrid) {
      this.tronGrid.destroy();
      this.tronGrid = new TronGrid(this, {
        horizonY: height * 0.35,
        gridWidth: width * 0.8,
        gridWidthAtHorizon: 60,
        color: 0x4f46e5,
        lineAlpha: 0.8,
        horizontalLines: 20,
        verticalLines: 10,
        scrollSpeed: 2,
        lineWidth: 2
      });
    }
    
    // Update player position
    if (this.player) {
      const playerY = height - 80;
      this.player.y = playerY;
      
      // Update player glow if it exists
      if (this.playerGlow) {
        this.playerGlow.y = playerY + 20;
      }
      
      // Make sure player is in the correct lane
      this.movePlayerToLane(this.currentLane);
    }
  }
  
  preload() {
    console.log('Preloading assets...');
    
    // Create a loading bar
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    
    const width = this.gameWidth || this.cameras.main.width;
    const height = this.gameHeight || this.cameras.main.height;
    
    progressBox.fillRect(width * 0.25, height * 0.45, width * 0.5, height * 0.1);
    
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
    
    // Try to load images, but create fallbacks if needed
    this.load.setPath('/assets/images/');
    
    try {
      this.load.image('player', 'player.png');
      this.load.image('obstacle', 'obstacle.png');
      this.load.image('data', 'data.png');
    } catch (e) {
      console.error('Error loading game assets:', e);
    }
    
    // Load audio assets
    this.load.setPath('/assets/audio/');
    
    try {
      this.load.audio('jump', 'jump.mp3');
      this.load.audio('collect', 'collect.mp3');
      this.load.audio('hit', 'hit.mp3');
      this.load.audio('gameover', 'gameover.mp3');
    } catch (e) {
      console.error('Error loading audio assets:', e);
    }
  }
  
  // Create fallback assets when images fail to load
  createFallbackAssets() {
    // Define sizes for fallback textures - make them responsive
    const playerSize = Math.min(this.gameHeight * 0.2, this.gameWidth * 0.15);
    const obstacleWidth = playerSize * 1.5; 
    const obstacleHeight = playerSize;
    const collectibleSize = playerSize * 0.5;
  
    // Create fallback textures if needed
    try {
      if (!this.textures.exists('player')) {
        console.log('Creating fallback player texture');
        const graphics = this.make.graphics({ x: 0, y: 0, add: false });
        graphics.fillStyle(0x4f46e5, 1);
        graphics.fillRect(0, 0, playerSize, playerSize);
        graphics.generateTexture('player', playerSize, playerSize);
        graphics.destroy();
      }
    } catch (e) {
      console.error('Failed to create player texture:', e);
    }
    
    try {
      if (!this.textures.exists('obstacle')) {
        console.log('Creating fallback obstacle texture');
        const graphics = this.make.graphics({ x: 0, y: 0, add: false });
        graphics.fillStyle(0xef4444, 1);
        graphics.fillRect(0, 0, obstacleWidth, obstacleHeight);
        graphics.generateTexture('obstacle', obstacleWidth, obstacleHeight);
        graphics.destroy();
      }
    } catch (e) {
      console.error('Failed to create obstacle texture:', e);
    }
    
    try {
      if (!this.textures.exists('data')) {
        console.log('Creating fallback data texture');
        const graphics = this.make.graphics({ x: 0, y: 0, add: false });
        graphics.fillStyle(0x38bdf8, 1);
        graphics.fillRect(0, 0, collectibleSize, collectibleSize);
        graphics.generateTexture('data', collectibleSize, collectibleSize);
        graphics.destroy();
      }
    } catch (e) {
      console.error('Failed to create data texture:', e);
    }
  }
  
  create() {
    console.log('Creating game scene');
    
    // Ensure we have dimensions
    this.gameWidth = this.gameWidth || this.cameras.main.width;
    this.gameHeight = this.gameHeight || this.cameras.main.height;
    
    console.log("Creating scene with dimensions:", this.gameWidth, "x", this.gameHeight);
    
    // Create fallback assets if needed
    this.createFallbackAssets();
    
    // Create the 3D perspective Tron grid
    this.tronGrid = new TronGrid(this, {
      horizonY: this.gameHeight * 0.35,       // Position horizon at 35% from top
      gridWidth: this.gameWidth * 0.8,        // 80% of screen width at bottom
      gridWidthAtHorizon: 60,                 // Narrow at horizon
      color: 0x4f46e5,                        // Tron blue
      lineAlpha: 0.8,                         // Semi-transparent
      horizontalLines: 20,                    // More horizontal lines for smoother effect
      verticalLines: 10,                      // Number of vertical lines
      scrollSpeed: 2,                         // How fast grid moves toward viewer
      lineWidth: 2                            // Line thickness
    });
    
    // Set background color
    this.cameras.main.setBackgroundColor(0x0a0e17); // Dark blue background
    
    // Create player character
    this.createPlayer();
    
    // IMPORTANT FIX: Don't create UI elements in Phaser since React handles them
    // Set to null to avoid errors elsewhere in the code
    this.scoreText = null;
    this.difficultyText = null;
    
    // Setup input for jumping
    this.input.on('pointerdown', this.jump, this);
    this.input.keyboard.on('keydown-SPACE', this.jump, this);
    
    // Add keyboard controls for left/right movement
    this.cursors = this.input.keyboard.createCursorKeys();
    
    // Start game
    this.isGameOver = false;
    this.spawnTimer = this.obstacleInterval;
    this.dataSpawnTimer = this.dataInterval;
    
    // Add some initial objects
    for (let i = 0; i < 10; i++) {
      const z = 200 + (i * 100);
      if (i % 3 === 0) {
        this.spawnObstacleAtDistance(z);
      } else {
        this.spawnCollectibleAtDistance(z);
      }
    }
    
    // Speed increase over time
    this.time.addEvent({
      delay: 10000, // 10 seconds
      callback: this.increaseSpeed,
      callbackScope: this,
      loop: true
    });
    
    console.log('Game scene created successfully');
  }
  
  createPlayer() {
    // Player is positioned at the bottom center of the screen
    const playerX = this.gameWidth / 2;
    const playerY = this.gameHeight - 80; // A bit up from the bottom
    
    // Calculate appropriate player size based on screen dimensions
    // This makes player size responsive to screen size
    const size = Math.min(this.gameHeight * 0.2, this.gameWidth * 0.15);
    
    // If player texture exists, use it; otherwise create a simple sprite
    if (this.textures.exists('player')) {
      this.player = this.add.sprite(playerX, playerY, 'player');
      this.player.setDisplaySize(size, size);
    } else {
      this.player = this.add.rectangle(playerX, playerY, size, size, 0x4f46e5);
    }
    
    // Set player properties
    this.player.setDepth(50);
    this.player.isJumping = false;
    this.player.jumpHeight = this.gameHeight * 0.15; // Responsive jump height
    this.player.jumpDuration = 500;
    
    // Add glow effect to make player more visible
    this.playerGlow = this.add.ellipse(
      playerX,
      playerY + 20,
      size * 1.5,
      size * 0.5,
      0x4f46e5,
      0.4
    );
    this.playerGlow.setDepth(45);
    
    // Create pulsing effect for the glow
    this.tweens.add({
      targets: this.playerGlow,
      alpha: { from: 0.4, to: 0.6 },
      scale: { from: 1, to: 1.1 },
      duration: 1000,
      yoyo: true,
      repeat: -1
    });
    
    // Set current lane (center by default)
    this.currentLane = 1;
    this.movePlayerToLane(1); // Ensure player is centered
  }
  
  update(time, delta) {
    if (this.isGameOver) return;
    
    // Store current lane to detect any unexpected changes
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
    if (this.cursors && Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
      this.moveLeft();
    } else if (this.cursors && Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
      this.moveRight();
    }
    
    // Spawn timers
    this.spawnTimer -= delta;
    if (this.spawnTimer <= 0) {
      this.spawnObstacle();
      this.spawnTimer = this.obstacleInterval;
    }
    
    this.dataSpawnTimer -= delta;
    if (this.dataSpawnTimer <= 0) {
      this.spawnCollectible();
      this.dataSpawnTimer = this.dataInterval;
    }
    
    // Filter out collected objects from our processing arrays
    if (Array.isArray(this.objectsPool)) {
      this.objectsPool = this.objectsPool.filter(obj => {
        // Skip undefined objects or already destroyed objects
        if (!obj || obj.destroyed) return false;
        
        // If this is a collected object, remove from pool
        if (obj.type === 'collectible' && obj.collected) {
          return false;
        }
        
        // Update z position (moving closer to the camera)
        obj.z -= this.gameSpeed * (delta / 16.667);
        
        // If object has passed the camera, destroy and remove
        if (obj.z <= 0) {
          if (obj.sprite) {
            obj.sprite.destroy();
          }
          return false; // remove from pool
        }
        
        // Update visual properties based on z-distance
        this.updateObjectVisuals(obj);
        
        // Check for collisions with player
        if (obj.z < 50 && obj.z > 30) {
          // Calculate lane of object
          const objLaneIndex = Math.round(obj.lane * (this.lanes.length - 1));
          
          if (objLaneIndex === this.currentLane) {
            if (obj.type === 'collectible' && !obj.collected) {
              // Collect data
              this.collectData(obj);
            } else if (obj.type === 'obstacle' && this.player && !this.player.isJumping && !obj.hit) {
              // Hit obstacle - only if not already hit
              this.hitObstacle(obj);
            }
          }
        }
        
        return true; // keep in pool
      });
    }
    
    // IMPORTANT FIX: Ensure lane position wasn't accidentally changed
    if (this.currentLane !== savedLane) {
      console.log("Lane was accidentally changed from", savedLane, "to", this.currentLane);
      this.currentLane = savedLane;
      // Update player position to correct lane
      this.movePlayerToLane(savedLane);
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
    
    // Create jump tween
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
    
    // Animate the jump effect
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
    
    // Safety check for laneIndex
    if (laneIndex < 0 || laneIndex >= this.lanes.length) {
      console.error("Invalid lane index:", laneIndex);
      return;
    }
    
    // Store the current position before updating
    const currentPlayerX = this.player.x;
    
    // Calculate the X position based on lane
    const playerY = this.player.y;
    const perspectiveRatio = (playerY - this.tronGrid.config.horizonY) / 
                            (this.gameHeight - this.tronGrid.config.horizonY);
    const roadWidth = this.tronGrid.config.gridWidthAtHorizon + 
                     (this.tronGrid.config.gridWidth - this.tronGrid.config.gridWidthAtHorizon) * 
                     perspectiveRatio;
    const roadLeft = (this.gameWidth - roadWidth) / 2;
    const lanePosition = this.lanes[laneIndex];
    const targetX = roadLeft + roadWidth * lanePosition;
    
    // Don't move if we're already very close to the target position
    if (Math.abs(targetX - currentPlayerX) < 5) {
      return;
    }
    
    // Clear any existing movement tweens
    if (this.tweens) {
      this.tweens.killTweensOf(this.player);
      if (this.playerGlow) {
        this.tweens.killTweensOf(this.playerGlow);
      }
    }
    
    // Create tween to move player
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
    // Pick a random lane index
    const laneIndex = Math.floor(Math.random() * this.lanes.length);
    
    // Spawn it far into the distance
    this.spawnObstacleAtDistance(1000);
  }
  
  spawnObstacleAtDistance(z) {
    if (!this.tronGrid) return;
    
    // Pick a random lane index
    const laneIndex = Math.floor(Math.random() * this.lanes.length);
    
    // Calculate initial visual position based on z distance
    const ratio = 40 / z;
    const y = this.tronGrid.config.horizonY + 
             (this.gameHeight - this.tronGrid.config.horizonY) * ratio;
    
    // Calculate lane position
    const lane = this.lanes[laneIndex];
    
    // Calculate x position based on perspective
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
    
    // Set rendering depth
    sprite.setDepth(30);
    
    // Create obstacle object and add to pool
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
    
    // Initial size update
    this.updateObjectVisuals(obstacle);
  }
  
  spawnCollectible() {
    // Spawn data collectible far into the distance
    this.spawnCollectibleAtDistance(1000);
  }
  
  spawnCollectibleAtDistance(z) {
    if (!this.tronGrid) return;
    
    // Pick a random lane index
    const laneIndex = Math.floor(Math.random() * this.lanes.length);
    
    // Calculate initial visual position based on z distance
    const ratio = 40 / z;
    const y = this.tronGrid.config.horizonY + 
             (this.gameHeight - this.tronGrid.config.horizonY) * ratio;
    
    // Calculate lane position
    const lane = this.lanes[laneIndex];
    
    // Calculate x position based on perspective
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
    
    // Set rendering depth
    sprite.setDepth(30);
    
    // Add pulsing animation
    this.tweens.add({
      targets: sprite,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 500,
      yoyo: true,
      repeat: -1
    });
    
    // Create collectible object and add to pool
    const collectible = {
      type: 'collectible',
      sprite: sprite,
      lane: laneIndex / (this.lanes.length - 1), // Normalize to 0-1
      z: z,
      baseWidth: Math.min(this.gameHeight * 0.08, this.gameWidth * 0.08),
      baseHeight: Math.min(this.gameHeight * 0.08, this.gameWidth * 0.08),
      collected: false,
      destroyed: false
    };
    
    if (Array.isArray(this.objectsPool)) {
      this.objectsPool.push(collectible);
    }
    
    // Initial size update
    this.updateObjectVisuals(collectible);
  }
  
  updateObjectVisuals(obj) {
    if (!obj || !obj.sprite || !this.tronGrid) return;
    
    // Skip if this object has been collected
    if ((obj.type === 'collectible' && obj.collected) || 
        (obj.sprite && !obj.sprite.visible) || 
        obj.destroyed) {
      return;
    }
    
    // Calculate perspective ratio based on z distance
    const ratio = 40 / obj.z;
    
    // Calculate perspective coordinates
    const y = this.tronGrid.config.horizonY + 
             (this.gameHeight - this.tronGrid.config.horizonY) * ratio;
    
    // Calculate road width at this y position
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
    
    // Update sprite position
    obj.sprite.x = x;
    obj.sprite.y = y;
    
    // Update sprite size based on distance
    const scale = ratio * 3.0;
    obj.sprite.displayWidth = obj.baseWidth * scale;
    obj.sprite.displayHeight = obj.baseHeight * scale;
    
    // Adjust visibility (fade out at the horizon)
    obj.sprite.alpha = Math.min(1, ratio * 2);
  }
  
  collectData(obj) {
    if (!obj || !obj.sprite) return;
    
    // IMPORTANT FIX: Store current lane before doing ANYTHING
    const currentLane = this.currentLane;
    
    // Immediately prevent any duplicate collection
    if (obj.collected || obj.destroyed) return;
    
    // Mark as collected and destroyed
    obj.collected = true;
    obj.destroyed = true;
    
    // Play sound
    if (this.sound && this.sound.get('collect')) {
      this.sound.play('collect', { volume: 0.5 });
    }
    
    // IMPORTANT FIX: Don't update internal score in Phaser, let React handle it
    // REMOVED: this.score += 10;
    
    // Just emit the event for React to handle
    this.game.events.emit('updateScore', 10);
    
    // Hide the sprite immediately to prevent visual glitches
    obj.sprite.visible = false;
    
    // Create particle effect
    this.createCollectParticles(obj.sprite.x, obj.sprite.y);
    
    // Schedule sprite destruction after a short delay to prevent visual glitches
    this.time.delayedCall(50, () => {
      if (obj.sprite) {
        obj.sprite.destroy();
        obj.sprite = null;
      }
    });
    
    // IMPORTANT FIX: Force lane position to remain the same
    this.currentLane = currentLane;
  }
  
  createCollectParticles(x, y) {
    // Calculate particle size based on screen size
    const particleSize = Math.max(2, Math.min(this.gameWidth, this.gameHeight) * 0.01);
    
    // Create simple particle effect for data collection
    for (let i = 0; i < 15; i++) {
      const particle = this.add.circle(x, y, particleSize, 0x38bdf8);
      particle.setAlpha(0.7);
      particle.setDepth(40);
      
      this.tweens.add({
        targets: particle,
        x: x + Math.floor(Math.random() * 200) - 100,
        y: y + Math.floor(Math.random() * 200) - 100,
        alpha: 0,
        scale: 0,
        duration: 500,
        onComplete: () => {
          particle.destroy();
        }
      });
    }
    
    // Add floating score text
    const fontSize = Math.max(20, Math.min(this.gameWidth, this.gameHeight) * 0.04);
    const scorePopup = this.add.text(x, y - 20, '+10', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: `${fontSize}px`,
      color: '#38bdf8'
    }).setOrigin(0.5);
    scorePopup.setDepth(45);
    
    // Animate score popup
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
    if (this.isGameOver || !obj || !obj.sprite) return;
    
    console.log("Hit obstacle");
    
    // Mark as hit to prevent multiple hits
    obj.hit = true;
    this.isGameOver = true;
    
    // Play sound
    if (this.sound && this.sound.get('hit')) {
      this.sound.play('hit', { volume: 0.7 });
    }
    
    // Delayed game over sound
    if (this.sound && this.sound.get('gameover')) {
      this.sound.play('gameover', { volume: 0.5, delay: 0.5 });
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
    
    // Emit game over event
    this.game.events.emit('gameOver', this.score);
    
    // Delay before switching to game over scene
    this.time.delayedCall(2000, () => {
      // Stop all tweens
      this.tweens.killAll();
      
      // Switch to game over scene with score
      this.scene.start('GameOverScene', { score: this.score });
    });
  }
  
  createCrashEffect(x, y) {
    // Calculate particle size based on screen dimensions
    const particleSize = Math.max(3, Math.min(this.gameWidth, this.gameHeight) * 0.015);
    const explosionSize = Math.min(this.gameWidth, this.gameHeight) * 0.15;
    
    // Create explosion particles
    for (let i = 0; i < 30; i++) {
      const particle = this.add.circle(x, y, Math.floor(Math.random() * particleSize) + particleSize, 0xef4444);
      particle.setDepth(60);
      
      this.tweens.add({
        targets: particle,
        x: x + Math.floor(Math.random() * 300) - 150,
        y: y + Math.floor(Math.random() * 300) - 150,
        alpha: 0,
        scale: { from: 1, to: 0 },
        duration: Math.floor(Math.random() * 500) + 500,
        onComplete: () => {
          particle.destroy();
        }
      });
    }
    
    // Add explosion effect
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
    
    // Add screen shake effect
    this.cameras.main.shake(300, 0.01);
  }
  
  increaseSpeed() {
    // Only increase speed if not at maximum
    if (this.gameSpeed < 5) {
      this.gameSpeed += 0.2;
      console.log('Game speed increased to:', this.gameSpeed);
      
      // Update difficulty text if speed exceeds hard level
      if (this.difficultyText && this.gameSpeed > this.difficulties.hard.speed + 1) {
        this.difficultyText.setText('LEVEL: EXTREME');
      }
    }
  }
}

export default MainScene;