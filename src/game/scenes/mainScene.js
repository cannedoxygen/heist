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
    
    // Set game parameters based on difficulty
    this.gameSpeed = this.difficulties[this.difficulty].speed;
    this.obstacleInterval = this.difficulties[this.difficulty].obstacleInterval;
    this.dataInterval = this.difficulties[this.difficulty].dataInterval;
    
    // Current lane (start in center)
    this.currentLane = 1;
  }
  
  preload() {
    console.log('Preloading assets...');
    
    // Create a loading bar
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(240, 270, 320, 50);
    
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const loadingText = this.add.text(width / 2, height / 2 - 50, 'Loading...', {
      font: '20px monospace',
      fill: '#ffffff'
    });
    loadingText.setOrigin(0.5, 0.5);
    
    // Loading progress events
    this.load.on('progress', (value) => {
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(250, 280, 300 * value, 30);
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
  
  create() {
    console.log('Creating game scene');
    
    // Get game dimensions
    this.gameWidth = this.cameras.main.width;
    this.gameHeight = this.cameras.main.height;
    
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
    
    // Add score text
    this.scoreText = this.add.text(20, 20, 'SCORE: 0', {
      fontSize: '24px',
      fontFamily: 'Orbitron, sans-serif',
      color: '#e0e7ff',
      stroke: '#000000',
      strokeThickness: 3
    }).setScrollFactor(0).setDepth(100);
    
    // Add difficulty text
    this.difficultyText = this.add.text(
      this.gameWidth - 20, 
      20, 
      `LEVEL: ${this.difficulty.toUpperCase()}`, 
      {
        fontSize: '18px',
        fontFamily: 'Orbitron, sans-serif',
        color: '#a9b4d1',
        stroke: '#000000',
        strokeThickness: 3
      }
    ).setScrollFactor(0).setOrigin(1, 0).setDepth(100);
    
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
  
  update(time, delta) {
    if (this.isGameOver) return;
    
    // Update the Tron grid
    this.tronGrid.update(delta);
    
    // Update player glow position
    if (this.playerGlow && this.player) {
      this.playerGlow.x = this.player.x;
      this.playerGlow.y = this.player.y + 20;
    }
    
    // Handle keyboard input
    if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
      this.moveLeft();
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
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
    this.objectsPool = this.objectsPool.filter(obj => {
      // If this is a collected object, destroy its sprite and remove from pool
      if (obj.type === 'collectible' && obj.collected) {
        return false; // remove from pool
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
            // Don't remove from array yet, just mark as collected
          } else if (obj.type === 'obstacle' && !this.player.isJumping && !obj.hit) {
            // Hit obstacle - only if not already hit
            this.hitObstacle(obj);
          }
        }
      }
      
      return true; // keep in pool
    });
  }
  
  createFallbackAssets() {
    // Create fallback textures if needed
    try {
      if (!this.textures.exists('player')) {
        console.log('Creating fallback player texture');
        const graphics = this.make.graphics({ x: 0, y: 0, add: false });
        graphics.fillStyle(0x4f46e5, 1);
        graphics.fillRect(0, 0, 30, 30);
        graphics.generateTexture('player', 30, 30);
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
        graphics.fillRect(0, 0, 60, 40);
        graphics.generateTexture('obstacle', 60, 40);
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
        graphics.fillRect(0, 0, 20, 20);
        graphics.generateTexture('data', 20, 20);
        graphics.destroy();
      }
    } catch (e) {
      console.error('Failed to create data texture:', e);
    }
  }
  
  createPlayer() {
    // Player is positioned at the bottom center of the screen
    const playerX = this.gameWidth / 2;
    const playerY = this.gameHeight - 80; // A bit up from the bottom
    
    // If player texture exists, use it; otherwise create a simple sprite
    if (this.textures.exists('player')) {
      this.player = this.add.sprite(playerX, playerY, 'player');
      this.player.setDisplaySize(70, 70);
    } else {
      this.player = this.add.rectangle(playerX, playerY, 70, 70, 0x4f46e5);
    }
    
    // Set player properties
    this.player.setDepth(50);
    this.player.isJumping = false;
    this.player.jumpHeight = 100;
    this.player.jumpDuration = 500;
    
    // Add glow effect to make player more visible
    this.playerGlow = this.add.ellipse(
      playerX,
      playerY + 20,
      90,
      30,
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
        this.player.isJumping = false;
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
    // Create a visual jump effect
    const jumpEffect = this.add.ellipse(
      this.player.x,
      this.player.y + 35,
      80,
      20,
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
    if (!this.player) return;
    
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
    this.tweens.killTweensOf(this.player);
    if (this.playerGlow) {
      this.tweens.killTweensOf(this.playerGlow);
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
      baseWidth: 80,
      baseHeight: 60,
      hit: false
    };
    
    this.objectsPool.push(obstacle);
    
    // Initial size update
    this.updateObjectVisuals(obstacle);
  }
  
  spawnCollectible() {
    // Spawn data collectible far into the distance
    this.spawnCollectibleAtDistance(1000);
  }
  
  spawnCollectibleAtDistance(z) {
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
      baseWidth: 30,
      baseHeight: 30,
      collected: false
    };
    
    this.objectsPool.push(collectible);
    
    // Initial size update
    this.updateObjectVisuals(collectible);
  }
  
  updateObjectVisuals(obj) {
    // Skip if this object has been collected
    if ((obj.type === 'collectible' && obj.collected) || 
        (obj.sprite && !obj.sprite.visible)) {
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
    const scale = ratio * 2.0; // Boosted scaling factor for better visibility
    obj.sprite.displayWidth = obj.baseWidth * scale;
    obj.sprite.displayHeight = obj.baseHeight * scale;
    
    // Adjust visibility (fade out at the horizon)
    obj.sprite.alpha = Math.min(1, ratio * 2);
  }
  
  collectData(obj) {
    // Immediately prevent any duplicate collection
    if (obj.collected) return;
    
    // Mark as collected
    obj.collected = true;
    
    // Play sound
    if (this.sound && this.sound.get('collect')) {
      this.sound.play('collect', { volume: 0.5 });
    }
    
    // Update score
    this.score += 10;
    this.scoreText.setText(`SCORE: ${this.score}`);
    
    // Hide the sprite immediately to prevent visual glitches
    obj.sprite.visible = false;
    
    // Create particle effect directly
    this.createCollectParticles(obj.sprite.x, obj.sprite.y);
    
    // Visual feedback on score
    this.tweens.add({
      targets: this.scoreText,
      scale: { from: 1.2, to: 1 },
      duration: 200,
      ease: 'Sine.easeOut'
    });
  }
  
  createCollectParticles(x, y) {
    // Create simple particle effect for data collection
    for (let i = 0; i < 15; i++) {
      const particle = this.add.circle(x, y, 5, 0x38bdf8);
      particle.setAlpha(0.7);
      particle.setDepth(40);
      
      this.tweens.add({
        targets: particle,
        x: x + Math.floor(Math.random() * 100) - 50,
        y: y + Math.floor(Math.random() * 100) - 50,
        alpha: 0,
        scale: 0,
        duration: 500,
        onComplete: () => {
          particle.destroy();
        }
      });
    }
    
    // Add floating score text
    const scorePopup = this.add.text(x, y - 20, '+10', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '20px',
      color: '#38bdf8'
    }).setOrigin(0.5);
    scorePopup.setDepth(45);
    
    // Animate score popup
    this.tweens.add({
      targets: scorePopup,
      y: y - 50,
      alpha: 0,
      duration: 800,
      onComplete: () => {
        scorePopup.destroy();
      }
    });
  }
  
  hitObstacle(obj) {
    if (this.isGameOver) return;
    
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
    this.tweens.add({
      targets: this.player,
      alpha: 0,
      duration: 100,
      yoyo: true,
      repeat: 5
    });
    
    // Create crash effect
    this.createCrashEffect(obj.sprite.x, obj.sprite.y);
    
    // Show game over text
    const gameOverText = this.add.text(
      this.gameWidth / 2, 
      this.gameHeight / 2 - 50, 
      'GAME OVER', 
      {
        fontSize: '48px',
        fontFamily: 'Orbitron, sans-serif',
        color: '#ef4444',
        stroke: '#000000',
        strokeThickness: 6
      }
    ).setScrollFactor(0).setOrigin(0.5).setDepth(100);
    
    const finalScoreText = this.add.text(
      this.gameWidth / 2, 
      this.gameHeight / 2 + 20, 
      `SCORE: ${this.score}`, 
      {
        fontSize: '32px',
        fontFamily: 'Orbitron, sans-serif',
        color: '#e0e7ff'
      }
    ).setScrollFactor(0).setOrigin(0.5).setDepth(100);
    
    // Add glitch effect to game over text
    this.tweens.add({
      targets: gameOverText,
      x: { from: gameOverText.x - 4, to: gameOverText.x + 4 },
      duration: 50,
      yoyo: true,
      repeat: -1
    });
    
    // Create "Play Again" button
    const playAgainButton = this.add.rectangle(
      this.gameWidth / 2,
      this.gameHeight / 2 + 80,
      200,
      50,
      0x4f46e5
    ).setInteractive();
    
    const playAgainText = this.add.text(
      this.gameWidth / 2,
      this.gameHeight / 2 + 80,
      'PLAY AGAIN',
      {
        fontSize: '24px',
        fontFamily: 'Orbitron, sans-serif',
        color: '#FFFFFF'
      }
    ).setScrollFactor(0).setOrigin(0.5).setDepth(100);
    
    // Add button interaction
    playAgainButton.on('pointerdown', () => {
      this.scene.restart();
    });
    
    // Add button hover effects
    playAgainButton.on('pointerover', () => {
      playAgainButton.setScale(1.05);
      playAgainText.setScale(1.05);
    });
    
    playAgainButton.on('pointerout', () => {
      playAgainButton.setScale(1);
      playAgainText.setScale(1);
    });
  }
  
  createCrashEffect(x, y) {
    // Create explosion particles
    for (let i = 0; i < 30; i++) {
      const particle = this.add.circle(x, y, Math.floor(Math.random() * 5) + 3, 0xef4444);
      particle.setDepth(60);
      
      this.tweens.add({
        targets: particle,
        x: x + Math.floor(Math.random() * 200) - 100,
        y: y + Math.floor(Math.random() * 200) - 100,
        alpha: 0,
        scale: { from: 1, to: 0 },
        duration: Math.floor(Math.random() * 500) + 500,
        onComplete: () => {
          particle.destroy();
        }
      });
    }
    
    // Add explosion effect
    const explosion = this.add.circle(x, y, 40, 0xef4444, 0.7);
    explosion.setDepth(55);
    
    this.tweens.add({
      targets: explosion,
      scale: 3,
      alpha: 0,
      duration: 500,
      onComplete: () => {
        explosion.destroy();
      }
    });
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