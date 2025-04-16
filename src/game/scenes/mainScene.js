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
    // Load assets
    this.load.image('player', '/assets/images/player.png');
    this.load.image('obstacle', '/assets/images/obstacle.png');
    this.load.image('data', '/assets/images/data.png');
    this.load.image('background', '/assets/images/grid_bg.png');
    
    // Load audio
    this.load.audio('jump', '/assets/audio/jump.mp3');
    this.load.audio('collect', '/assets/audio/collect.mp3');
    this.load.audio('hit', '/assets/audio/hit.mp3');
    this.load.audio('gameover', '/assets/audio/gameover.mp3');
  }
  
  create() {
    // Create background
    this.background = this.add.tileSprite(0, 0, this.cameras.main.width, this.cameras.main.height, 'background')
      .setOrigin(0, 0)
      .setScrollFactor(0, 0);
    
    // Create ground
    this.groundY = this.cameras.main.height - 50;
    this.ground = this.add.rectangle(0, this.groundY, this.cameras.main.width, 2, 0x4f46e5)
      .setOrigin(0, 0);
    this.physics.add.existing(this.ground, true);
    
    // Create player
    this.player = new Player(this, 100, this.groundY - 50);
    
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
    this.spawnObstacle();
    
    // Speed increase over time
    this.time.addEvent({
      delay: 10000, // 10 seconds
      callback: this.increaseSpeed,
      callbackScope: this,
      loop: true
    });
  }
  
  update(time, delta) {
    if (this.isGameOver) return;
    
    // Move background
    this.background.tilePositionX += (this.gameSpeed / 60) * (delta / 16.666);
    
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
    this.player.update();
    
    // Update obstacles and collectibles
    this.obstacles.getChildren().forEach(obstacle => {
      obstacle.update();
      
      // Remove if off screen
      if (obstacle.x < -obstacle.width) {
        obstacle.destroy();
      }
    });
    
    this.collectibles.getChildren().forEach(collectible => {
      collectible.update();
      
      // Remove if off screen
      if (collectible.x < -collectible.width) {
        collectible.destroy();
      }
    });
  }
  
  jump() {
    if (!this.isGameOver && this.player.body.touching.down) {
      this.player.jump();
      this.sound.play('jump', { volume: 0.5 });
    }
  }
  
  spawnObstacle() {
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
  }
  
  spawnCollectible() {
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
  }
  
  collectData(player, collectible) {
    // Play sound
    this.sound.play('collect', { volume: 0.5 });
    
    // Update score
    this.score += 10;
    this.scoreText.setText(`SCORE: ${this.score}`);
    
    // Visual feedback
    this.tweens.add({
      targets: this.scoreText,
      scale: { from: 1.2, to: 1 },
      duration: 200,
      ease: 'Sine.easeOut'
    });
    
    // Destroy collectible
    collectible.destroy();
    
    // Create particle effect
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
  }
  
  hitObstacle(player, obstacle) {
    if (this.isGameOver) return;
    
    // Set game over state
    this.isGameOver = true;
    
    // Play sound
    this.sound.play('hit', { volume: 0.7 });
    this.sound.play('gameover', { volume: 0.5, delay: 0.5 });
    
    // Stop player and obstacles
    this.player.body.setVelocity(0, 0);
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
      // Send score back to main game component
      this.game.events.emit('gameOver', this.score);
      
      // Reset scene for restart
      this.scene.restart();
    });
  }
  
  increaseSpeed() {
    // Gradually increase game speed
    this.gameSpeed += 10;
    
    // Update obstacle and collectible speeds
    this.obstacles.getChildren().forEach(obstacle => {
      obstacle.setVelocityX(-this.gameSpeed);
    });
    
    this.collectibles.getChildren().forEach(collectible => {
      collectible.setVelocityX(-this.gameSpeed);
    });
  }
}