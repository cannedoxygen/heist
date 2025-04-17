import Phaser from 'phaser';

export class Collectible {
  constructor(scene, x, y, z, lane) {
    this.scene = scene;
    this.z = z || 1000; // Z-distance (depth)
    this.lane = lane || 0.5; // Lane position (0-1)
    
    // Base properties (full size when at player position)
    this.baseWidth = 20;
    this.baseHeight = 20;
    
    // Create sprite
    if (scene.textures.exists('data')) {
      this.sprite = scene.add.sprite(x, y, 'data');
      this.sprite.setTint(0x38bdf8); // Blue tint
    } else {
      // Fallback to rectangle
      this.sprite = scene.add.rectangle(x, y, 8, 8, 0x38bdf8);
    }
    
    // Set depth to ensure proper rendering order
    this.sprite.setDepth(30);
    
    // Add to scene's object pool
    if (scene.objectsPool) {
      scene.objectsPool.push({
        type: 'collectible',
        sprite: this.sprite,
        lane: this.lane,
        z: this.z,
        baseWidth: this.baseWidth,
        baseHeight: this.baseHeight,
        collected: false
      });
    }
    
    // Add visual effects
    this.addVisualEffects();
  }
  
  addVisualEffects() {
    // Pulsing animation
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    // Add simple glow effect
    try {
      const glow = this.scene.add.ellipse(
        this.sprite.x,
        this.sprite.y,
        30,
        30,
        0x38bdf8,
        0.3
      );
      glow.setDepth(29);
      
      // Pulse the glow
      this.scene.tweens.add({
        targets: glow,
        scaleX: 1.5,
        scaleY: 1.5,
        alpha: 0.5,
        duration: 1000,
        yoyo: true,
        repeat: -1
      });
      
      // Update glow position
      this.scene.events.on('update', () => {
        glow.x = this.sprite.x;
        glow.y = this.sprite.y;
      });
      
      // Destroy glow when sprite is destroyed
      this.sprite.on('destroy', () => {
        glow.destroy();
      });
    } catch (e) {
      console.error('Could not create glow effect', e);
    }
  }
  
  update() {
    // This method is not used in the 3D perspective system
    // Updates are handled by the main scene
  }
  
  destroy() {
    this.sprite.destroy();
  }
}