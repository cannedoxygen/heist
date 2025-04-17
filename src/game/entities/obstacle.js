// Enhance src/game/entities/obstacle.js

export class Obstacle {
    // ... existing constructor and methods ...
    
    // Add method to handle collision
    hit(scene) {
      // Prevent multiple hits
      if (this.hit) return false;
      
      // Mark as hit
      this.hit = true;
      
      // Create hit effect
      this.createHitEffect(scene);
      
      // Play sound
      if (scene.sound && scene.sound.get('hit')) {
        scene.sound.play('hit', { volume: 0.7 });
      }
      
      return true;
    }
    
    createHitEffect(scene) {
      if (!this.sprite) return;
      
      const x = this.sprite.x;
      const y = this.sprite.y;
      
      // Calculate effect sizes based on screen
      const sceneWidth = scene.cameras.main.width;
      const sceneHeight = scene.cameras.main.height;
      const particleSize = Math.max(3, Math.min(sceneWidth, sceneHeight) * 0.015);
      const explosionSize = Math.min(sceneWidth, sceneHeight) * 0.15;
      
      // Create explosion particles
      for (let i = 0; i < 30; i++) {
        const particle = scene.add.circle(
          x, 
          y, 
          Phaser.Math.Between(particleSize, particleSize * 2), 
          0xef4444
        );
        particle.setDepth(60);
        
        scene.tweens.add({
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
      
      // Add explosion
      const explosion = scene.add.circle(x, y, explosionSize, 0xef4444, 0.7);
      explosion.setDepth(55);
      
      scene.tweens.add({
        targets: explosion,
        scale: 2,
        alpha: 0,
        duration: 500,
        onComplete: () => {
          explosion.destroy();
        }
      });
      
      // Add screen shake
      scene.cameras.main.shake(300, 0.01);
    }
  }