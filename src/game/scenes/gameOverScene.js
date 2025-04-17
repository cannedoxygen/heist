import Phaser from 'phaser';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
    this.score = 0;
  }
  
  init(data) {
    // Store the final score
    this.score = data?.score || 0;
    
    // Ensure buttons aren't already bound to prevent memory leaks
    this.input.keyboard.off('keydown-SPACE');
  }
  
  create() {
    const { width, height } = this.cameras.main;
    
    // Setup scene elements
    this.createBackground(width, height);
    this.createGameOverUI(width, height);
    this.createButtons();
    
    // Setup input handlers
    this.setupInputHandlers();
    
    // Send final score to React component
    this.sendScoreToReact();
  }
  
  createBackground(width, height) {
    // Background color
    this.add.rectangle(0, 0, width, height, 0x0a0e17).setOrigin(0);
    
    // Create grid effect
    this.createGridBackground(width, height);
    
    // Add corrupted data effect
    this.createCorruptedData();
  }
  
  createGridBackground(width, height) {
    // Create grid with perspective effect
    const gridGraphics = this.add.graphics();
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
    // Create data particles pool for reuse
    this.dataParticles = this.add.group();
    
    // Add initial particles
    for (let i = 0; i < 30; i++) {
      this.createDataParticle();
    }
    
    // Set up recurring creation of particles
    this.time.addEvent({
      delay: 500,
      callback: () => {
        // Only create new particles if scene is active
        if (this.scene.isActive('GameOverScene')) {
          this.createDataParticle();
        }
      },
      loop: true
    });
  }
  
  createDataParticle() {
    const { width, height } = this.cameras.main;
    const x = Phaser.Math.Between(0, width);
    const y = Phaser.Math.Between(0, height);
    const size = Phaser.Math.Between(3, 8);
    
    // Create or reuse particle
    let rect;
    if (this.dataParticles.countActive(true) < 50) {
      rect = this.add.rectangle(x, y, size, size, 0xef4444, 0.5);
      this.dataParticles.add(rect);
    } else {
      rect = this.dataParticles.getFirstDead(true, x, y, size, size);
      if (rect) {
        rect.setFillStyle(0xef4444, 0.5);
        rect.setActive(true);
        rect.setVisible(true);
      } else {
        rect = this.add.rectangle(x, y, size, size, 0xef4444, 0.5);
        this.dataParticles.add(rect);
      }
    }
    
    if (!rect) return;
    
    // Random movement
    this.tweens.add({
      targets: rect,
      x: x + Phaser.Math.Between(-100, 100),
      y: y + Phaser.Math.Between(-100, 100),
      alpha: { from: 0.5, to: 0 },
      duration: Phaser.Math.Between(1000, 3000),
      onComplete: () => {
        // Mark as inactive instead of destroying
        rect.setActive(false);
        rect.setVisible(false);
      }
    });
  }
  
  createGameOverUI(width, height) {
    // Game over container for organizing elements
    const gameOverContainer = this.add.container(width / 2, height / 2 - 50);
    
    // Game over text with glitch effect
    const gameOverText = this.add.text(0, 0, 'GAME OVER', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '48px',
      color: '#ef4444',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5);
    
    // Score text
    const scoreText = this.add.text(0, 80, `SCORE: ${this.score}`, {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '32px',
      color: '#e0e7ff'
    }).setOrigin(0.5);
    
    // Add to container
    gameOverContainer.add([gameOverText, scoreText]);
    
    // Apply glitch effect to game over text
    this.applyGlitchEffect(gameOverText);
  }
  
  applyGlitchEffect(target) {
    // Glitch effect with random offsets
    this.glitchTimer = this.time.addEvent({
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
    
    // Button container for organization
    const buttonContainer = this.add.container(width / 2, height - 115);
    
    // Restart button
    const restartButton = this.add.rectangle(0, 0, 200, 50, 0x4f46e5)
      .setInteractive()
      .on('pointerdown', this.restartGame, this);
    
    const restartText = this.add.text(0, 0, 'PLAY AGAIN', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '18px',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    // Leaderboard button
    const leaderboardButton = this.add.rectangle(0, 70, 200, 50, 0x141c2b)
      .setInteractive()
      .on('pointerdown', this.viewLeaderboard, this);
    
    const leaderboardText = this.add.text(0, 70, 'LEADERBOARD', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '18px',
      color: '#a9b4d1'
    }).setOrigin(0.5);
    
    // Add to container
    buttonContainer.add([
      restartButton, restartText,
      leaderboardButton, leaderboardText
    ]);
    
    // Add hover effects
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
  
  setupInputHandlers() {
    // Space key to restart
    this.input.keyboard.once('keydown-SPACE', this.restartGame, this);
    
    // ESC key to go to leaderboard
    this.input.keyboard.once('keydown-ESC', this.viewLeaderboard, this);
    
    // Touch handler for mobile
    this.input.on('pointerdown', (pointer) => {
      // Double tap to restart
      if (pointer.downTime - (pointer.previousDownTime || 0) < 300) {
        this.restartGame();
      }
    });
  }
  
  restartGame() {
    // Cleanup first
    this.cleanup();
    
    // Restart main scene
    this.scene.start('MainScene');
  }
  
  viewLeaderboard() {
    // Cleanup first
    this.cleanup();
    
    // Emit event to React to show leaderboard
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
  
  cleanup() {
    // Stop all timers
    if (this.glitchTimer) {
      this.glitchTimer.remove();
    }
    
    // Stop all tweens
    this.tweens.killAll();
    
    // Clear all input handlers
    this.input.keyboard.off('keydown-SPACE', this.restartGame, this);
    this.input.keyboard.off('keydown-ESC', this.viewLeaderboard, this);
  }
  
  shutdown() {
    // Ensure proper cleanup
    this.cleanup();
    
    // Call parent shutdown
    super.shutdown();
  }
}

export default GameOverScene;