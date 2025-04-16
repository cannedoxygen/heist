import Phaser from 'phaser';
import { Player } from '../entities/player';
import { Obstacle } from '../entities/obstacle';
import { Collectible } from '../entities/collectible';

export class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene');
    
    // Game state
    this.score = 0;
    this.isGameOver = false;
    this.gameSpeed = 300;
    this.spawnTimer = 0;
    this.dataSpawnTimer = 0;
    
    // Difficulty settings
    this.difficulties = {
      easy: { 
        speed: 300, 
        obstacleInterval: 2000, 
        dataInterval: 1000 
      },
      normal: { 
        speed: 350, 
        obstacleInterval: 1500, 
        dataInterval: 800 
      },
      hard: { 
        speed: 400, 
        obstacleInterval: 1200, 
        dataInterval: 600 
      }
    };
    
    // Current difficulty
    this.difficulty = 'normal';
    
    // Track loaded assets
    this.assetsLoaded = {
      player: false,
      obstacle: false,
      data: false,
      background: false
    };
  }
  
  init(data) {
    // Reset game state
    this.score = 0;
    this.isGameOver = false;
    
    // Set difficulty if provided
    if (data && data.difficulty) {
      this.difficulty = data.difficulty;
    }
    
    // Set game parameters based on difficulty
    this.gameSpeed = this.difficulties[this.difficulty].speed;
    this.obstacleInterval = this.difficulties[this.difficulty].obstacleInterval;
    this.dataInterval = this.difficulties[this.difficulty].dataInterval;
  }
  
  preload() {
    console.log('Preloading assets...');
    
    // Create a loading bar for visual feedback
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
      console.log(`Loading progress: ${Math.round(value * 100)}%`);
    });
    
    this.load.on('fileprogress', (file) => {
      console.log(`Loading file: ${file.key} (${Math.round(file.percentComplete * 100)}%)`);
    });
    
    this.load.on('filecomplete', (key) => {
      console.log(`File complete: ${key}`);
      // Track successfully loaded assets
      if (this.assetsLoaded.hasOwnProperty(key)) {
        this.assetsLoaded[key] = true;
      }
    });
    
    this.load.on('loaderror', (file) => {
      console.error(`Error loading file: ${file.key}`);
      console.error(`URL attempted: ${file.url}`);
      // Mark asset as failed
      if (this.assetsLoaded.hasOwnProperty(file.key)) {
        this.assetsLoaded[file.key] = false;
      }
    });
    
    this.load.on('complete', () => {
      console.log('All assets attempted to load');
      console.log('Asset status:', this.assetsLoaded);
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
    });
    
    // Explicitly set the path for images - use public folder path
    this.load.setPath('/assets/images/');
    this.load.image('player', 'player.png');
    this.load.image('obstacle', 'obstacle.png');
    this.load.image('data', 'data.png');
    this.load.image('background', 'grid_bg.png');
    
    // Set path for audio assets
    this.load.setPath('/assets/audio/');
    this.load.audio('jump', 'jump.mp3');
    this.load.audio('collect', 'collect.mp3');
    this.load.audio('hit', 'hit.mp3');
    this.load.audio('gameover', 'gameover.mp3');
  }
  
  create() {
    console.log('Creating game scene');
    
    // Get game dimensions
    const gameWidth = this.cameras.main.width;  // Should be 800
    const gameHeight = this.cameras.main.height; // Should be 400
    console.log(`Game dimensions: ${gameWidth}x${gameHeight}`);
    
    // Debug to check asset loading
    console.log('Texture status before fallbacks:');
    console.log('- player:', this.textures.exists('player'));
    console.log('- obstacle:', this.textures.exists('obstacle'));
    console.log('- data:', this.textures.exists('data'));
    console.log('- background:', this.textures.exists('background'));
    
    // Create fallback assets if needed
    this.createFallbackAssets();
    
    console.log('Texture status after fallbacks:');
    console.log('- player:', this.textures.exists('player'));
    console.log('- obstacle:', this.textures.exists('obstacle'));
    console.log('- data:', this.textures.exists('data'));
    console.log('- background:', this.textures.exists('background'));
    
    // Create background for 3D runner effect
    try {
      // Create tileSprite with grid
      this.background = this.add.tileSprite(0, 0, gameWidth, gameHeight, 'background')
        .setOrigin(0, 0)
        .setScrollFactor(0, 0);
      
      // Check background texture dimensions
      if (this.textures.exists('background')) {
        const bgImage = this.textures.get('background').getSourceImage();
        console.log(`Background texture dimensions: ${bgImage.width}x${bgImage.height}`);
        
        // Set tileScale to 1 since the texture is already correctly sized
        this.background.tileScaleX = 1;
        this.background.tileScaleY = 1;
        
        console.log('Background tileScale set to 1x1');
      }
      
      console.log('Created background with texture');
    } catch (e) {
      console.error('Error creating background:', e);
      // Fallback to simple rectangle
      this.background = this.add.rectangle(0, 0, gameWidth, gameHeight, 0x0a0e17)
        .setOrigin(0, 0);
      console.log('Created fallback background rectangle');
    }
    
    // Create center lane marker
    const centerX = gameWidth / 2;
    this.centerLine = this.add.line(0, 0, centerX, 0, centerX, gameHeight, 0x4f46e5, 0.3)
      .setOrigin(0, 0);
    
    // Create ground - positioned at the bottom of the screen
    this.groundY = gameHeight - 50;
    this.ground = this.add.rectangle(0, this.groundY, gameWidth, 2, 0x4f46e5)
      .setOrigin(0, 0);
    this.physics.add.existing(this.ground, true);
    
    // Create player in center of screen
    if (this.textures.exists('player')) {
      try {
        this.player = new Player(this, centerX, this.groundY - 50);
        console.log('Player created successfully');
      } catch (e) {
        console.error('Error creating player:', e);
        this.createSimplePlayer(centerX);
      }
    } else {
      console.log('Player texture does not exist, creating simple player');
      this.createSimplePlayer(centerX);
    }
    
    // Create groups
    this.obstacles = this.physics.add.group();
    this.collectibles = this.physics.add.group();
    
    // Add colliders
    this.physics.add.collider(this.player, this.ground);
    this.physics.add.collider(this.obstacles, this.ground);
    this.physics.add.collider(this.collectibles, this.ground);
    
    // Add overlap callbacks
    this.physics.add.overlap(
      this.player, 
      this.obstacles, 
      this.hitObstacle, 
      null, 
      this
    );
    
    this.physics.add.overlap(
      this.player, 
      this.collectibles, 
      this.collectData, 
      null, 
      this
    );
    
    // Add score text
    this.scoreText = this.add.text(20, 20, 'SCORE: 0', {
      fontSize: '24px',
      fontFamily: 'Orbitron',
      color: '#e0e7ff'
    }).setScrollFactor(0);
    
    // Add difficulty text
    this.difficultyText = this.add.text(
      gameWidth - 20, 
      20, 
      `LEVEL: ${this.difficulty.toUpperCase()}`, 
      {
        fontSize: '18px',
        fontFamily: 'Orbitron',
        color: '#a9b4d1'
      }
    ).setScrollFactor(0).setOrigin(1, 0);
    
    // Setup input for jumping
    this.input.on('pointerdown', this.jump, this);
    this.input.keyboard.on('keydown-SPACE', this.jump, this);
    
    // Add keyboard controls for left/right movement
    this.cursors = this.input.keyboard.createCursorKeys();
    
    // Add swipe controls for mobile
    this.input.on('pointermove', this.handleSwipe, this);
    this.input.on('pointerup', this.endSwipe, this);
    this.swipeStart = null;
    
    // Game lanes settings
    this.lanes = [
      gameWidth / 4,           // Left lane
      gameWidth / 2,           // Center lane
      (gameWidth / 4) * 3      // Right lane
    ];
    
    // Current lane (start in center)
    this.currentLane = 1;
    
    // Start game
    this.isGameOver = false;
    this.spawnTimer = this.obstacleInterval;
    this.dataSpawnTimer = this.dataInterval;
    
    // Speed increase over time
    this.time.addEvent({
      delay: 10000, // 10 seconds
      callback: this.increaseSpeed,
      callbackScope: this,
      loop: true
    });
    
    console.log('Game scene created successfully');
  }
  
  // Create a simple player rectangle
  createSimplePlayer(centerX) {
    console.log('Creating simple player rectangle');
    this.player = this.physics.add.rectangle(centerX, this.groundY - 50, 30, 30, 0x4f46e5);
    this.player.setCollideWorldBounds(true);
    this.player.setBounce(0.1);
    this.player.setGravityY(1000);
    
    // Add custom jump method
    this.player.jump = function() {
      if (this.body.touching.down) {
        this.setVelocityY(-500);
      }
    };
    
    // Add lane movement method
    this.player.moveTo = function(x, duration = 200) {
      this.scene.tweens.add({
        targets: this,
        x: x,
        duration: duration,
        ease: 'Power2'
      });
    };
  }
  
  // Handle swiping on mobile
  handleSwipe(pointer) {
    if (!this.swipeStart) {
      this.swipeStart = { x: pointer.x, y: pointer.y, time: pointer.time };
    }
  }
  
  endSwipe(pointer) {
    if (this.swipeStart && !this.isGameOver) {
      const swipeTime = pointer.time - this.swipeStart.time;
      const swipeDistance = Phaser.Math.Distance.Between(
        this.swipeStart.x, this.swipeStart.y, 
        pointer.x, pointer.y
      );
      
      // Check if this is a valid swipe
      if (swipeTime < 1000 && swipeDistance > 50) {
        // Check swipe direction
        const swipeX = pointer.x - this.swipeStart.x;
        const swipeY = pointer.y - this.swipeStart.y;
        
        // Horizontal swipe detection (with greater tolerance for diagonal swipes)
        if (Math.abs(swipeX) > Math.abs(swipeY) * 0.5) {
          if (swipeX > 0) {
            this.moveRight();
          } else {
            this.moveLeft();
          }
        }
        
        // Vertical swipe detection - only for upward swipes (jump)
        if (swipeY < -50 && Math.abs(swipeY) > Math.abs(swipeX)) {
          this.jump();
        }
      }
    }
    
    // Reset swipe start
    this.swipeStart = null;
  }
  
  createFallbackAssets() {
    // Create fallback textures one by one with specific error handling
    try {
      if (!this.textures.exists('player')) {
        console.log('Creating fallback player texture');
        const graphics = this.make.graphics({ x: 0, y: 0, add: false });
        graphics.fillStyle(0x4f46e5, 1);
        graphics.fillRect(0, 0, 30, 30); // Use rectangle instead of circle for simplicity
        graphics.generateTexture('player', 30, 30);
        console.log('Player texture created:', this.textures.exists('player'));
        graphics.destroy();
      }
    } catch (e) {
      console.error('Failed to create player texture:', e);
    }
    
    // Separate try/catch for each texture
    try {
      if (!this.textures.exists('obstacle')) {
        console.log('Creating fallback obstacle texture');
        const graphics = this.make.graphics({ x: 0, y: 0, add: false });
        graphics.fillStyle(0xef4444, 1);
        graphics.fillRect(0, 0, 40, 20);
        graphics.generateTexture('obstacle', 40, 20);
        console.log('Obstacle texture created:', this.textures.exists('obstacle'));
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
        graphics.fillRect(0, 0, 24, 24);
        graphics.generateTexture('data', 24, 24);
        console.log('Data texture created:', this.textures.exists('data'));
        graphics.destroy();
      }
    } catch (e) {
      console.error('Failed to create data texture:', e);
    }
    
    try {
      if (!this.textures.exists('background')) {
        console.log('Creating fallback background texture');
        const graphics = this.make.graphics({ x: 0, y: 0, add: false });
        graphics.fillStyle(0x0a0e17, 1);
        graphics.fillRect(0, 0, 64, 64);
        graphics.lineStyle(1, 0x1d2837, 0.3);
        graphics.strokeRect(0, 0, 32, 32);
        graphics.generateTexture('background', 64, 64);
        console.log('Background texture created:', this.textures.exists('background'));
        graphics.destroy();
      }
    } catch (e) {
      console.error('Failed to create background texture:', e);
    }
  }
  
  update(time, delta) {
    if (this.isGameOver) return;
    
    // Move background (scrolling down effect for 3D feel)
    if (this.background && this.background.tilePositionY !== undefined) {
      this.background.tilePositionY += (this.gameSpeed / 120) * (delta / 16.666);
    }
    
    // Handle keyboard controls
    if (this.cursors.left.isDown) {
      this.moveLeft();
    } else if (this.cursors.right.isDown) {
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
    
    // Update player
    if (this.player && typeof this.player.update === 'function') {
      this.player.update();
    }
    
    // Update obstacles and collectibles
    this.obstacles.getChildren().forEach(obstacle => {
      // Update custom obstacle animations
      if (typeof obstacle.update === 'function') {
        obstacle.update();
      }
      
      // Move obstacles forward (down)
      obstacle.y += (this.gameSpeed / 60) * (delta / 16.666);
      
      // Remove if off screen
      if (obstacle.y > this.cameras.main.height + 50) {
        obstacle.destroy();
      }
    });
    
    this.collectibles.getChildren().forEach(collectible => {
      // Update custom collectible animations
      if (typeof collectible.update === 'function') {
        collectible.update();
      }
      
      // Move collectibles forward (down)
      collectible.y += (this.gameSpeed / 60) * (delta / 16.666);
      
      // Remove if off screen
      if (collectible.y > this.cameras.main.height + 50) {
        collectible.destroy();
      }
    });
  }
  
  // Player left lane movement
  moveLeft() {
    if (this.isGameOver) return;
    
    // Check if we can move left
    if (this.currentLane > 0) {
      this.currentLane--;
      const targetX = this.lanes[this.currentLane];
      
      // Move player to the target lane
      if (this.player.moveTo) {
        this.player.moveTo(targetX);
      } else {
        // For standard sprites without a custom moveTo method
        this.tweens.add({
          targets: this.player,
          x: targetX,
          duration: 200,
          ease: 'Power2'
        });
      }
      
      // Play a sound effect if available
      try {
        if (this.sound && this.sound.get('move')) {
          this.sound.play('move', { volume: 0.3 });
        }
      } catch (e) {
        console.error('Error playing move sound:', e);
      }
    }
  }
  
  // Player right lane movement
  moveRight() {
    if (this.isGameOver) return;
    
    // Check if we can move right
    if (this.currentLane < this.lanes.length - 1) {
      this.currentLane++;
      const targetX = this.lanes[this.currentLane];
      
      // Move player to the target lane
      if (this.player.moveTo) {
        this.player.moveTo(targetX);
      } else {
        // For standard sprites without a custom moveTo method
        this.tweens.add({
          targets: this.player,
          x: targetX,
          duration: 200,
          ease: 'Power2'
        });
      }
      
      // Play a sound effect if available
      try {
        if (this.sound && this.sound.get('move')) {
          this.sound.play('move', { volume: 0.3 });
        }
      } catch (e) {
        console.error('Error playing move sound:', e);
      }
    }
  }
  
  jump() {
    try {
      if (!this.isGameOver && this.player) {
        // Check if player is on ground
        const isOnGround = this.player.body && this.player.body.touching && this.player.body.touching.down;
        
        if (isOnGround) {
          // Use player's jump method if available
          if (typeof this.player.jump === 'function') {
            this.player.jump();
          } else {
            // Otherwise apply velocity directly
            this.player.body.setVelocityY(-500);
          }
          
          // Play sound with safety check
          if (this.sound && this.sound.get && this.sound.get('jump')) {
            this.sound.play('jump', { volume: 0.5 });
          }
        }
      }
    } catch (e) {
      console.error('Error in jump method:', e);
    }
  }
  
  spawnObstacle() {
    try {
      // Random lane
      const lane = Phaser.Math.Between(0, this.lanes.length - 1);
      const laneX = this.lanes[lane];
      
      // Random obstacle size
      const height = Phaser.Math.Between(20, 40);
      const width = Phaser.Math.Between(30, 80);
      
      // Position at top of screen but in the right lane
      const obstacleY = -50; // Just above the screen
      
      // Check if we have the obstacle texture
      if (this.textures.exists('obstacle')) {
        // Create obstacle sprite directly (without using the class)
        const obstacle = this.physics.add.sprite(laneX, obstacleY, 'obstacle');
        obstacle.setDisplaySize(width, height);
        obstacle.setTint(0xef4444);
        
        // Set the physics properties
        obstacle.body.allowGravity = false;
        obstacle.body.immovable = true;
        
        this.obstacles.add(obstacle);
        console.log('Obstacle spawned in lane', lane);
      } else {
        // Use rectangle as fallback
        const rectObstacle = this.physics.add.rectangle(
          laneX,
          obstacleY,
          width,
          height,
          0xef4444
        );
        
        rectObstacle.body.allowGravity = false;
        rectObstacle.body.immovable = true;
        
        this.obstacles.add(rectObstacle);
      }
    } catch (e) {
      console.error('Error spawning obstacle:', e);
    }
  }
  
  spawnCollectible() {
    try {
      // Random lane
      const lane = Phaser.Math.Between(0, this.lanes.length - 1);
      const laneX = this.lanes[lane];
      
      // Position above the screen
      const collectibleY = -50;
      
      // Check if we have the data texture
      if (this.textures.exists('data')) {
        // Create collectible sprite directly
        const collectible = this.physics.add.sprite(laneX, collectibleY, 'data');
        collectible.setDisplaySize(24, 24);
        collectible.setTint(0x38bdf8);
        
        // Set physics properties
        collectible.body.allowGravity = false;
        
        // Add pulsing effect
        this.tweens.add({
          targets: collectible,
          scale: { from: 1, to: 1.2 },
          duration: 500,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
        
        this.collectibles.add(collectible);
        console.log('Collectible spawned in lane', lane);
      } else {
        // Use rectangle as fallback
        const rectCollectible = this.physics.add.rectangle(
          laneX,
          collectibleY,
          24,
          24,
          0x38bdf8
        );
        
        rectCollectible.body.allowGravity = false;
        
        this.collectibles.add(rectCollectible);
      }
    } catch (e) {
      console.error('Error spawning collectible:', e);
    }
  }
  
  collectData(player, collectible) {
    console.log('Data collected');
    
    try {
      // Play sound with safety check
      if (this.sound && this.sound.get && this.sound.get('collect')) {
        this.sound.play('collect', { volume: 0.5 });
      }
      
      // Update score
      this.score += 10;
      this.scoreText.setText(`SCORE: ${this.score}`);
      
      // Send score update to game engine
      this.game.events.emit('updateScore', 10);
      
      // Visual feedback
      this.tweens.add({
        targets: this.scoreText,
        scale: { from: 1.2, to: 1 },
        duration: 200,
        ease: 'Sine.easeOut'
      });
      
      // Destroy collectible
      collectible.destroy();
      
      // Create simple particle effect
      try {
        const particles = this.add.particles(collectible.x, collectible.y, 'data', {
          scale: { start: 0.5, end: 0 },
          speed: { min: 50, max: 100 },
          lifespan: 500,
          blendMode: 'ADD',
          quantity: 10
        });
        
        // Auto-destroy particles
        this.time.delayedCall(500, () => {
          particles.destroy();
        });
      } catch (e) {
        console.error('Error creating particles:', e);
      }
    } catch (e) {
      console.error('Error in collectData method:', e);
    }
  }
  
  hitObstacle(player, obstacle) {
    if (this.isGameOver) return;
    
    console.log('Hit obstacle, game over');
    
    try {
      // Set game over state
      this.isGameOver = true;
      
      // Play sound with safety check
      if (this.sound && this.sound.get) {
        if (this.sound.get('hit')) {
          this.sound.play('hit', { volume: 0.7 });
        }
        
        if (this.sound.get('gameover')) {
          this.sound.play('gameover', { volume: 0.5, delay: 0.5 });
        }
      }
      
      // Flash player
      this.tweens.add({
        targets: this.player,
        alpha: { from: 0, to: 1 },
        duration: 100,
        repeat: 5
      });
      
      // Show game over text
      const gameOverText = this.add.text(
        this.cameras.main.width / 2, 
        this.cameras.main.height / 2 - 50, 
        'GAME OVER', 
        {
          fontSize: '48px',
          fontFamily: 'Orbitron',
          color: '#ef4444',
          stroke: '#000000',
          strokeThickness: 6
        }
      ).setScrollFactor(0).setOrigin(0.5);
      
      const scoreText = this.add.text(
        this.cameras.main.width / 2, 
        this.cameras.main.height / 2 + 20, 
        `SCORE: ${this.score}`, 
        {
          fontSize: '32px',
          fontFamily: 'Orbitron',
          color: '#e0e7ff'
        }
      ).setScrollFactor(0).setOrigin(0.5);
      
      // Add glitch effect to game over text
      this.tweens.add({
        targets: gameOverText,
        x: { from: gameOverText.x - 4, to: gameOverText.x + 4 },
        duration: 50,
        yoyo: true,
        repeat: -1
      });
      
      // Trigger game over callback after delay
      this.time.delayedCall(2000, () => {
        console.log('Game over, sending final score:', this.score);
        
        // Send score back to game component
        if (this.game && this.game.events) {
          this.game.events.emit('gameOver', this.score);
        }
        
        // Check if GameOverScene exists before starting it
        if (this.scene.get('GameOverScene')) {
          this.scene.start('GameOverScene', { score: this.score });
        } else {
          console.warn('GameOverScene not found, restarting MainScene');
          this.scene.restart();
        }
      });
    } catch (e) {
      console.error('Error in hitObstacle method:', e);
    }
  }
  
  increaseSpeed() {
    try {
      // Gradually increase game speed
      this.gameSpeed += 10;
      console.log('Game speed increased to:', this.gameSpeed);
      
      // Update difficulty text if needed
      if (this.difficultyText && this.gameSpeed > this.difficulties.hard.speed) {
        this.difficultyText.setText(`LEVEL: EXTREME`);
      }
    } catch (e) {
      console.error('Error in increaseSpeed method:', e);
    }
  }
}