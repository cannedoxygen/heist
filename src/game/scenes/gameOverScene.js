import Phaser from 'phaser';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
    
    this.score = 0;
  }
  
  init(data) {
    this.score = data.score || 0;
  }
  
  create() {
    const { width, height } = this.cameras.main;
    
    // Add background
    this.add.rectangle(0, 0, width, height, 0x0a0e17).setOrigin(0);
    
    // Add grid effect background (simplified version)
    this.createGridBackground();
    
    // Add corrupted data effect
    this.createCorruptedData();
    
    // Game over container
    const gameOverContainer = this.add.container(width / 2, height / 2 - 50);
    
    // Add game over text with glitch effect
    const gameOverText = this.add.text(0, 0, 'GAME OVER', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '48px',
      color: '#ef4444',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5);
    
    // Add score text
    const scoreText = this.add.text(0, 80, `SCORE: ${this.score}`, {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '32px',
      color: '#e0e7ff'
    }).setOrigin(0.5);
    
    gameOverContainer.add([gameOverText, scoreText]);
    
    // Apply glitch effect to game over text
    this.glitchEffect(gameOverText);
    
    // Create buttons
    this.createButtons();
    
    // Add input events
    this.input.keyboard.on('keydown-SPACE', this.restartGame, this);
    
    // Send score to React component
    this.sendScoreToReact();
  }
  
  createGridBackground() {
    const { width, height } = this.cameras.main;
    
    // Create grid with perspective effect
    const gridGraphics = this.add.graphics();
    
    // Set line style
    gridGraphics.lineStyle(1, 0x1d2837, 0.3);
    
    // Draw horizontal grid lines
    const horizonY = height * 0.35;
    const gridLines = 20;
    
    for (let i = 0; i <= gridLines; i++) {
      const y = horizonY + ((height - horizonY) / gridLines) * i;
      const perspectiveRatio = (y - horizonY) / (height - horizonY);
      const lineWidth = 60 + (width * 0.8 - 60) * perspectiveRatio;
      
      gridGraphics.beginPath();
      gridGraphics.moveTo(width / 2 - lineWidth / 2, y);
      gridGraphics.lineTo(width / 2 + lineWidth / 2, y);
      gridGraphics.strokePath();
    }
    
    // Draw vertical grid lines
    for (let i = 0; i <= 10; i++) {
      const xRatio = i / 10;
      const leftX = width / 2 - width * 0.4;
      const rightX = width / 2 + width * 0.4;
      const vanishX = width / 2;
      
      gridGraphics.beginPath();
      gridGraphics.moveTo(vanishX, horizonY);
      gridGraphics.lineTo(leftX + (rightX - leftX) * xRatio, height);
      gridGraphics.strokePath();
    }
  }
  
  createCorruptedData() {
    // Add corrupted data particles in the background
    for (let i = 0; i < 30; i++) {
      const x = Phaser.Math.Between(0, this.cameras.main.width);
      const y = Phaser.Math.Between(0, this.cameras.main.height);
      const size = Phaser.Math.Between(3, 8);
      
      const rect = this.add.rectangle(x, y, size, size, 0xef4444, 0.5);
      
      // Random movement
      this.tweens.add({
        targets: rect,
        x: x + Phaser.Math.Between(-100, 100),
        y: y + Phaser.Math.Between(-100, 100),
        alpha: { from: 0.5, to: 0 },
        duration: Phaser.Math.Between(1000, 3000),
        onComplete: () => {
          rect.destroy();
          // Only create new data if scene is still active
          if (this.scene.isActive('GameOverScene')) {
            this.createDataParticle();
          }
        }
      });
    }
  }
  
  createDataParticle() {
    const { width, height } = this.cameras.main;
    const x = Phaser.Math.Between(0, width);
    const y = Phaser.Math.Between(0, height);
    const size = Phaser.Math.Between(3, 8);
    
    const rect = this.add.rectangle(x, y, size, size, 0xef4444, 0.5);
    
    // Random movement
    this.tweens.add({
      targets: rect,
      x: x + Phaser.Math.Between(-100, 100),
      y: y + Phaser.Math.Between(-100, 100),
      alpha: { from: 0.5, to: 0 },
      duration: Phaser.Math.Between(1000, 3000),
      onComplete: () => {
        rect.destroy();
        // Only create new data if scene is still active
        if (this.scene.isActive('GameOverScene')) {
          this.createDataParticle();
        }
      }
    });
  }
  
  glitchEffect(target) {
    // Create glitch effect with random offsets
    this.time.addEvent({
      delay: 100,
      callback: () => {
        if (Math.random() > 0.8) {
          const offsetX = Phaser.Math.Between(-5, 5);
          const offsetY = Phaser.Math.Between(-5, 5);
          
          target.setPosition(
            this.cameras.main.width / 2 + offsetX,
            this.cameras.main.height / 2 - 50
          );
          
          // Random color change
          if (Math.random() > 0.5) {
            target.setTint(0x38bdf8); // Blue glitch
          } else {
            target.setTint(0xef4444); // Red glitch
          }
          
          // Reset after short delay
          this.time.delayedCall(50, () => {
            target.setPosition(this.cameras.main.width / 2, this.cameras.main.height / 2 - 50);
            target.clearTint();
          });
        }
      },
      loop: true
    });
  }
  
  createButtons() {
    const { width, height } = this.cameras.main;
    
    // Restart button
    const restartButton = this.add.rectangle(
      width / 2,
      height - 150,
      200,
      50,
      0x4f46e5
    ).setInteractive();
    
    const restartText = this.add.text(
      width / 2,
      height - 150,
      'PLAY AGAIN',
      {
        fontFamily: 'Orbitron, sans-serif',
        fontSize: '18px',
        color: '#ffffff'
      }
    ).setOrigin(0.5);
    
    // Leaderboard button
    const leaderboardButton = this.add.rectangle(
      width / 2,
      height - 80,
      200,
      50,
      0x141c2b
    ).setInteractive();
    
    const leaderboardText = this.add.text(
      width / 2,
      height - 80,
      'LEADERBOARD',
      {
        fontFamily: 'Orbitron, sans-serif',
        fontSize: '18px',
        color: '#a9b4d1'
      }
    ).setOrigin(0.5);
    
    // Button interactions
    restartButton.on('pointerdown', this.restartGame, this);
    leaderboardButton.on('pointerdown', this.viewLeaderboard, this);
    
    // Hover effects
    this.addButtonHoverEffects(restartButton, restartText);
    this.addButtonHoverEffects(leaderboardButton, leaderboardText);
  }
  
  addButtonHoverEffects(button, text) {
    button.on('pointerover', () => {
      button.setScale(1.05);
      text.setScale(1.05);
    });
    
    button.on('pointerout', () => {
      button.setScale(1);
      text.setScale(1);
    });
  }
  
  restartGame() {
    // Restart main game scene
    this.scene.start('MainScene');
  }
  
  viewLeaderboard() {
    // Send event to React to show leaderboard
    if (this.game.events) {
      this.game.events.emit('viewLeaderboard');
    }
    
    // If using browser navigation
    if (window.location) {
      window.location.href = '/leaderboard';
    }
  }
  
  sendScoreToReact() {
    // Send final score to React component
    if (this.game.events) {
      this.game.events.emit('gameOver', this.score);
    }
  }
}

export default GameOverScene;