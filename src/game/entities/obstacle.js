import Phaser from 'phaser';

export class Obstacle {
  constructor(scene, x, y, z, lane) {
    this.scene = scene;
    this.z = z || 1000; // Z-distance (depth)
    this.lane = lane || 0.5; // Lane position (0-1)
    
    // Base properties - 4x larger than original
    this.baseWidth = 240;
    this.baseHeight = 160;
    this.jitterRange = 20; // For glitch effect
    
    // Create sprite
    if (scene.textures.exists('obstacle')) {
      this.sprite = scene.add.sprite(x, y, 'obstacle');
      this.sprite.setTint(0xef4444); // Red tint
    } else {
      // Fallback to rectangle
      this.sprite = scene.add.rectangle(x, y, 40, 20, 0xef4444);
    }
    
    // Set depth to ensure proper rendering order
    this.sprite.setDepth(30);
    
    // Add to scene's object pool
    if (scene.objectsPool) {
      scene.objectsPool.push({
        type: 'obstacle',
        sprite: this.sprite,
        lane: this.lane,
        z: this.z,
        baseWidth: this.baseWidth,
        baseHeight: this.baseHeight,
        hit: false
      });
    }
    
    // Add effects
    this.addGlitchEffect();
  }
  
  addGlitchEffect() {
    // Random glitch effect
    this.scene.time.addEvent({
      delay: Math.floor(Math.random() * 2000) + 1000, // Random delay between 1-3 seconds
      callback: () => {
        if (Math.random() > 0.7) {
          // Flash the obstacle
          this.sprite.setAlpha(0.5);
          this.scene.time.delayedCall(100, () => {
            this.sprite.setAlpha(1);
          });
          
          // Random position jitter
          const origX = this.sprite.x;
          const origY = this.sprite.y;
          this.sprite.x += Math.floor(Math.random() * this.jitterRange * 2) - this.jitterRange;
          this.sprite.y += Math.floor(Math.random() * this.jitterRange * 2) - this.jitterRange;
          this.scene.time.delayedCall(100, () => {
            this.sprite.x = origX;
            this.sprite.y = origY;
          });
        }
      },
      callbackScope: this,
      loop: true
    });
  }
  
  update() {
    // This method is not used in the 3D perspective system
    // Updates are handled by the main scene
  }
  
  destroy() {
    this.sprite.destroy();
  }
}