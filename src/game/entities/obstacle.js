import Phaser from 'phaser';

export class Obstacle extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, speed) {
    super(scene, x, y, 'obstacle');
    
    // Add to scene
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    // Physics properties
    this.setImmovable(true);
    this.body.allowGravity = false;
    this.setVelocityX(-speed);
    
    // Random width (for variety)
    const width = Phaser.Math.Between(30, 80);
    const height = Phaser.Math.Between(20, 40);
    
    // Visual properties
    this.setScale(1);
    
    // If using a placeholder rectangle instead of a sprite
    if (!scene.textures.exists('obstacle')) {
      this.setDisplaySize(width, height);
      this.setTint(0xef4444); // Red tint
    }
    
    // Add glow effect
    this.createGlow();
  }
  
  createGlow() {
    // Create glow effect using a light
    if (this.scene.lights && this.scene.lights.active) {
      const light = this.scene.lights.addLight(this.x, this.y, 128).setColor(0xef4444).setIntensity(2);
      
      // Update light position to follow obstacle
      this.scene.events.on('update', () => {
        light.x = this.x;
        light.y = this.y;
      });
      
      // Remove light when obstacle is destroyed
      this.on('destroy', () => {
        light.setIntensity(0);
        this.scene.lights.removeLight(light);
      });
    }
  }
  
  update() {
    // Optional: Add random glitching effect for corrupted data aesthetic
    if (Math.random() > 0.95) {
      this.setAlpha(0.5);
      this.scene.time.delayedCall(50, () => {
        this.setAlpha(1);
      });
    }
  }
}