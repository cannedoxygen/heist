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
    
    // Add background with grid
    const bg = this.add.graphics();
    bg.fillStyle(0x0a0e17, 1);
    bg.fillRect(0, 0, width, height);
    
    // Add grid lines
    const grid = this.add.graphics();
    grid.lineStyle(1, 0x1d2837, 0.3);
    
    // Draw vertical lines
    for (let x = 0; x < width; x += 50) {
      grid.lineBetween(x, 0, x, height);
    }
    
    // Draw horizontal lines
    for (let y = 0; y < height; y += 50) {
      grid.lineBetween(0, y, width, y);
    }
    
    // Add corrupted data effect
    this.createCorruptedData();
    
    // Game over container with glitch effect
    const gameOverContainer = this.add.container(width / 2, height / 2 - 50);
    
    // Add game over text with glitch effect
    const gameOverText = this.add.text(0, 0, 'GAME OVER', {
      fontFamily: 'Orbitron',
      fontSize: '48px',
      color: '#ef4444',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5);
    
    // Add score text
    const scoreText = this.add.text(0, 80, `SCORE: ${this.score}`, {
      fontFamily: 'Orbitron',
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
    this.input.keyboard.on('keydown-L', this.viewLeaderboard, this);
    
    // Send score to React component
    this.sendScoreToReact();
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
          this.createCorruptedData();
        }
      });
    }
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
        fontFamily: 'Orbitron',
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
        fontFamily: 'Orbitron',
        fontSize: '18px',
        color: '#a9b4d1'
      }
    ).setOrigin(0.5);
    
    // Button interactions
    restartButton.on('pointerdown', this.restartGame, this);
    leaderboardButton.on('pointerdown', this.viewLeaderboard, this);
    
    // Hover effects
    this.addButtonHoverEffects(restartButton);
    this.addButtonHoverEffects(leaderboardButton);
  }
  
  addButtonHoverEffects(button) {
    button.on('pointerover', () => {
      button.setScale(1.05);
      this.tweens.add({
        targets: button,
        alpha: 0.8,
        duration: 100
      });
    });
    
    button.on('pointerout', () => {
      button.setScale(1);
      this.tweens.add({
        targets: button,
        alpha: 1,
        duration: 100
      });
    });
  }
  
  restartGame() {
    // Restart main game scene
    this.scene.start('MainScene');
  }
  
  viewLeaderboard() {
    // Send event to React to show leaderboard
    this.game.events.emit('viewLeaderboard');
  }
  
  sendScoreToReact() {
    // Send final score to React component
    this.game.events.emit('gameOver', this.score);
  }
}