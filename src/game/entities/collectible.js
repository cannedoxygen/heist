// Enhance src/game/entities/collectible.js

export class Collectible {
    // ... existing constructor and methods ...
    
    // Add method to handle collection
    collect(scene) {
      // Prevent double collection
      if (this.collected || this.destroyed) return false;
      
      // Mark as collected
      this.collected = true;
      
      // Play collection sound if available
      if (scene.sound && scene.sound.get('collect')) {
        scene.sound.play('collect', { volume: 0.5 });
      }
      
      // Create particles effect
      this.createCollectParticles(scene);
      
      // Hide sprite
      if (this.sprite) {
        this.sprite.visible = false;
      }
      
      // Remove glow
      if (this.glow) {
        this.glow.destroy();
        this.glow = null;
      }
      
      // Return true to indicate successful collection
      return true;
    }
    
    createCollectParticles(scene) {
      // Only create particles if sprite exists
      if (!this.sprite) return;
      
      const x = this.sprite.x;
      const y = this.sprite.y;
      
      // Calculate particle size based on screen dimensions
      const sceneWidth = scene.cameras.main.width;
      const sceneHeight = scene.cameras.main.height;
      const particleSize = Math.max(2, Math.min(sceneWidth, sceneHeight) * 0.01);
      
      // Create particles
      for (let i = 0; i < 15; i++) {
        const particle = scene.add.circle(x, y, particleSize, 0x38bdf8);
        particle.setAlpha(0.7);
        particle.setDepth(40);
        
        scene.tweens.add({
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
      
      // Add score popup
      const fontSize = Math.max(20, Math.min(sceneWidth, sceneHeight) * 0.04);
      const scorePopup = scene.add.text(x, y - 20, '+10', {
        fontFamily: 'Orbitron, sans-serif',
        fontSize: `${fontSize}px`,
        color: '#38bdf8'
      }).setOrigin(0.5);
      scorePopup.setDepth(45);
      
      // Animate the popup
      scene.tweens.add({
        targets: scorePopup,
        y: y - 240,
        alpha: 0,
        duration: 800,
        onComplete: () => {
          scorePopup.destroy();
        }
      });
    }
  }