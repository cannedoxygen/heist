import Phaser from 'phaser';

export class Collectible extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, speed) {
    super(scene, x, y, 'data');
    
    // Add to scene
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    // Physics properties
    this.body.allowGravity = false;
    this.setVelocityX(-speed);
    
    // Set hitbox
    this.body.setSize(24, 24);
    
    // Visual properties
    this.setScale(1);
    
    // If using a placeholder square instead of a sprite
    if (!scene.textures.exists('data')) {
      this.setDisplaySize(24, 24);
      this.setTint(0x38bdf8); // Data blue tint
    }
    
    // Add animation and effects
    this.createAnimation();
  }
  
  createAnimation() {
    // Pulse animation
    this.scene.tweens.add({
      targets: this,
      scale: { from: 1, to: 1.2 },
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    // Particle emitter for data stream effect
    if (this.scene.particles && this.scene.textures.exists('data')) {
      const particles = this.scene.add.particles(this.x, this.y, 'data', {
        scale: { start: 0.2, end: 0 },
        alpha: { start: 0.5, end: 0 },
        speed: 20,
        lifespan: 300,
        blendMode: 'ADD',
        frequency: 100,
        emitZone: { type: 'edge', source: new Phaser.Geom.Circle(0, 0, 15), quantity: 8 }
      });
      
      // Update particle position to follow collectible
      this.scene.events.on('update', () => {
        particles.setPosition(this.x, this.y);
      });
      
      // Remove particles when collectible is destroyed
      this.on('destroy', () => {
        particles.destroy();
      });
    }
  }
  
  update() {
    // Optional: Add floating motion
    this.y += Math.sin(this.scene.time.now / 200) * 0.5;
    
    // Optional: Random data glitch effect
    if (Math.random() > 0.98) {
      this.setTint(0xf472b6); // Momentary color change
      this.scene.time.delayedCall(100, () => {
        this.setTint(0x38bdf8); // Return to original color
      });
    }
  }
}