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
    
    // Check environment for debugging
    console.log('Environment info:', {
      baseUrl: window.location.origin,
      pathname: window.location.pathname,
      publicPath: process.env.PUBLIC_URL || '',
      nodeEnv: process.env.NODE_ENV
    });
    
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
    
    // Try multiple asset path formats - one of these should work
    try {
      // Try path format 1: just the path (most common)
      this.load.image('player', 'assets/images/player.png');
      this.load.image('obstacle', 'assets/images/obstacle.png');
      this.load.image('data', 'assets/images/data.png');
      this.load.image('background', 'assets/images/grid_bg.png');
      
      // Try path format 2: with leading slash
      this.load.image('player_alt1', '/assets/images/player.png');
      
      // Try path format 3: with PUBLIC_URL
      const publicUrl = process.env.PUBLIC_URL || '';
      this.load.image('player_alt2', `${publicUrl}/assets/images/player.png`);
      
      // Try path format 4: with absolute URL
      const baseUrl = window.location.origin;
      this.load.image('player_alt3', `${baseUrl}/assets/images/player.png`);
      
      // Load audio with the same approach as images
      this.load.audio('jump', 'assets/audio/jump.mp3');
      this.load.audio('collect', 'assets/audio/collect.mp3');
      this.load.audio('hit', 'assets/audio/hit.mp3');
      this.load.audio('gameover', 'assets/audio/gameover.mp3');
    } catch (e) {
      console.error('Error in asset loading:', e);
    }
    
    // Explicitly check if files exist using fetch
    const filesToCheck = [
      'assets/images/player.png',
      '/assets/images/player.png',
      './assets/images/player.png'
    ];
    
    filesToCheck.forEach(path => {
      fetch(path)
        .then(response => {
          console.log(`Fetch ${path}: ${response.status} ${response.statusText}`);
          if (response.ok) {
            console.log(`File exists at ${path}`);
          } else {
            console.log(`File not found at ${path}`);
          }
        })
        .catch(error => {
          console.error(`Fetch error for ${path}:`, error);
        });
    });
  }
  
  create() {
    console.log('Creating game scene');
    console.log('Texture status before fallbacks:');
    console.log('- player:', this.textures.exists('player'));
    console.log('- obstacle:', this.textures.exists('obstacle'));
    console.log('- data:', this.textures.exists('data'));
    console.log('- background:', this.textures.exists('background'));
    
    // Check if any alternates loaded
    const playerAlternates = [
      'player_alt1', 'player_alt2', 'player_alt3'
    ];
    
    for (const alt of playerAlternates) {
      if (this.textures.exists(alt)) {
        console.log(`Found alternate texture: ${alt}`);
        // Clone this texture to the primary key
        this.textures.addImage('player', this.textures.get(alt).getSourceImage());
        break;
      }
    }
    
    // Create fallback assets if needed
    this.createFallbackAssets();
    
    console.log('Texture status after fallbacks:');
    console.log('- player:', this.textures.exists('player'));
    console.log('- obstacle:', this.textures.exists('obstacle'));
    console.log('- data:', this.textures.exists('data'));
    console.log('- background:', this.textures.exists('background'));
    
    // Create background
    try {
      this.background = this.add.tileSprite(0, 0, this.cameras.main.width, this.cameras.main.height, 'background')
        .setOrigin(0, 0)
        .setScrollFactor(0, 0);
      console.log('Created background with texture');
    } catch (e) {
      console.error('Error creating background:', e);
      // Fallback to simple rectangle
      this.background = this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x0a0e17)
        .setOrigin(0, 0);
      console.log('Created fallback background rectangle');
    }
    
    // Create ground
    this.groundY = this.cameras.main.height - 50;
    this.ground = this.add.rectangle(0, this.groundY, this.cameras.main.width, 2, 0x4f46e5)
      .setOrigin(0, 0);
    this.physics.add.existing(this.ground, true);
    
    // Create player
    try {
      this.player = new Player(this, 100, this.groundY - 50);
      console.log('Player created successfully');
    } catch (e) {
      console.error('Error creating player:', e);
      // Fallback to simple player rectangle
      this.player = this.physics.add.sprite(100, this.groundY - 50, 'player');
      this.player.setDisplaySize(30, 30);
      this.player.setTint(0x4f46e5);
      this.player.setCollideWorldBounds(true);
      this.player.setBounce(0.1);
      this.player.setGravityY(1000);
      this.player.jumpForce = -500;
      console.log('Created fallback player object');
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
      this.cameras.main.width - 20, 
      20, 
      `LEVEL: ${this.difficulty.toUpperCase()}`, 
      {
        fontSize: '18px',
        fontFamily: 'Orbitron',
        color: '#a9b4d1'
      }
    ).setScrollFactor(0).setOrigin(1, 0);
    
    // Setup input
    this.input.on('pointerdown', this.jump, this);
    this.input.keyboard.on('keydown-SPACE', this.jump, this);
    
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
  
  createFallbackAssets() {
    try {
      // Create fallback textures if assets didn't load
      if (!this.textures.exists('player')) {
        console.log('Creating fallback player texture');
        const graphics = this.make.graphics({ x: 0, y: 0, add: false });
        graphics.fillStyle(0x4f46e5, 1);
        graphics.fillCircle(15, 15, 15);
        graphics.generateTexture('player', 30, 30);
        graphics.destroy();
      }
      
      if (!this.textures.exists('obstacle')) {
        console.log('Creating fallback obstacle texture');
        const graphics = this.make.graphics({ x: 0, y: 0, add: false });
        graphics.fillStyle(0xef4444, 1);
        graphics.fillRect(0, 0, 40, 20);
        graphics.generateTexture('obstacle', 40, 20);
        graphics.destroy();
      }
      
      if (!this.textures.exists('data')) {
        console.log('Creating fallback data texture');
        const graphics = this.make.graphics({ x: 0, y: 0, add: false });
        graphics.fillStyle(0x38bdf8, 1);
        graphics.fillRect(0, 0, 24, 24);
        graphics.generateTexture('data', 24, 24);
        graphics.destroy();
      }
      
      if (!this.textures.exists('background')) {
        console.log('Creating fallback background texture');
        const graphics = this.make.graphics({ x: 0, y: 0, add: false });
        graphics.fillStyle(0x0a0e17, 1);
        graphics.fillRect(0, 0, 64, 64);
        graphics.lineStyle(1, 0x1d2837, 0.3);
        graphics.strokeRect(0, 0, 32, 32);
        graphics.generateTexture('background', 64, 64);
        graphics.destroy();
      }
    } catch (e) {
      console.error('Error creating fallback assets:', e);
    }
  }
  
  update(time, delta) {
    if (this.isGameOver) return;
    
    // Move background
    if (this.background && this.background.tilePositionX !== undefined) {
      this.background.tilePositionX += (this.gameSpeed / 60) * (delta / 16.666);
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
      if (typeof obstacle.update === 'function') {
        obstacle.update();
      }
      
      // Remove if off screen
      if (obstacle.x < -obstacle.width) {
        obstacle.destroy();
      }
    });
    
    this.collectibles.getChildren().forEach(collectible => {
      if (typeof collectible.update === 'function') {
        collectible.update();
      }
      
      // Remove if off screen
      if (collectible.x < -collectible.width) {
        collectible.destroy();
      }
    });
  }
  
  jump() {
    try {
      if (!this.isGameOver && this.player && this.player.body && this.player.body.touching.down) {
        // Use player's jump method if available
        if (typeof this.player.jump === 'function') {
          this.player.jump();
        } else {
          // Otherwise apply velocity directly
          this.player.body.setVelocityY(-500);
        }
        
        // Play sound with safety check
        if (this.sound.get('jump')) {
          this.sound.play('jump', { volume: 0.5 });
        }
      }
    } catch (e) {
      console.error('Error in jump method:', e);
    }
  }
  
  spawnObstacle() {
    try {
      // Random obstacle height
      const height = Phaser.Math.Between(20, 40);
      
      // Create obstacle
      const obstacle = new Obstacle(
        this, 
        this.cameras.main.width + 100, 
        this.groundY - height / 2, 
        this.gameSpeed
      );
      
      this.obstacles.add(obstacle);
      console.log('Obstacle spawned');
    } catch (e) {
      console.error('Error spawning obstacle:', e);
      
      // Create fallback obstacle
      try {
        const height = Phaser.Math.Between(20, 40);
        const width = Phaser.Math.Between(30, 80);
        
        const fallbackObstacle = this.physics.add.sprite(
          this.cameras.main.width + 100,
          this.groundY - height / 2,
          'obstacle'
        );
        
        fallbackObstacle.setDisplaySize(width, height);
        fallbackObstacle.setVelocityX(-this.gameSpeed);
        fallbackObstacle.setImmovable(true);
        fallbackObstacle.body.allowGravity = false;
        
        this.obstacles.add(fallbackObstacle);
        console.log('Fallback obstacle spawned');
      } catch (innerE) {
        console.error('Failed to create fallback obstacle:', innerE);
      }
    }
  }
  
  spawnCollectible() {
    try {
      // Random y position
      const y = Phaser.Math.Between(
        this.groundY - 200, 
        this.groundY - 50
      );
      
      // Create data collectible
      const collectible = new Collectible(
        this, 
        this.cameras.main.width + 100, 
        y, 
        this.gameSpeed
      );
      
      this.collectibles.add(collectible);
      console.log('Collectible spawned');
    } catch (e) {
      console.error('Error spawning collectible:', e);
      
      // Create fallback collectible
      try {
        const y = Phaser.Math.Between(
          this.groundY - 200, 
          this.groundY - 50
        );
        
        const fallbackCollectible = this.physics.add.sprite(
          this.cameras.main.width + 100,
          y,
          'data'
        );
        
        fallbackCollectible.setDisplaySize(24, 24);
        fallbackCollectible.setTint(0x38bdf8);
        fallbackCollectible.setVelocityX(-this.gameSpeed);
        fallbackCollectible.body.allowGravity = false;
        
        this.collectibles.add(fallbackCollectible);
        console.log('Fallback collectible spawned');
      } catch (innerE) {
        console.error('Failed to create fallback collectible:', innerE);
      }
    }
  }
  
  collectData(player, collectible) {
    console.log('Data collected');
    
    try {
      // Play sound with safety check
      if (this.sound.get('collect')) {
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
      if (this.sound.get('hit')) {
        this.sound.play('hit', { volume: 0.7 });
      }
      
      if (this.sound.get('gameover')) {
        this.sound.play('gameover', { volume: 0.5, delay: 0.5 });
      }
      
      // Stop player and obstacles
      if (this.player && this.player.body) {
        this.player.body.setVelocity(0, 0);
      }
      
      this.obstacles.getChildren().forEach(obs => {
        obs.setVelocity(0, 0);
      });
      
      this.collectibles.getChildren().forEach(col => {
        col.setVelocity(0, 0);
      });
      
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
      
      // Update obstacle and collectible speeds
      this.obstacles.getChildren().forEach(obstacle => {
        obstacle.setVelocityX(-this.gameSpeed);
      });
      
      this.collectibles.getChildren().forEach(collectible => {
        collectible.setVelocityX(-this.gameSpeed);
      });
      
      // Update difficulty text if needed
      if (this.difficultyText && this.gameSpeed > this.difficulties.hard.speed) {
        this.difficultyText.setText(`LEVEL: EXTREME`);
      }
    } catch (e) {
      console.error('Error in increaseSpeed method:', e);
    }
  }
}