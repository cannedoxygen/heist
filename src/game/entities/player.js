import Phaser from 'phaser';

export class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'player');
    
    // Add to scene
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    // Physics properties
    this.setCollideWorldBounds(true);
    this.setBounce(0.1);
    this.setGravityY(1000);
    
    // Set hitbox
    this.body.setSize(30, 30);
    
    // Jump properties
    this.jumpForce = -500;
    
    // Visual properties (set these if using a spritesheet)
    this.setScale(1);
    
    // If using a placeholder rectangle instead of a sprite
    if (!scene.textures.exists('player')) {
      this.setDisplaySize(30, 30);
      this.setTint(0x4f46e5); // Blue tint
    }
    
    // Animation state
    this.isJumping = false;
    
    // Set up animations
    this.createAnimations();
  }
  
  createAnimations() {
    // If using a spritesheet, set up animations here
    // For a placeholder, we'll skip this
    const anims = this.scene.anims;
    
    if (!anims.exists('player-run')) {
      anims.create({
        key: 'player-run',
        frames: anims.generateFrameNumbers('player', { start: 0, end: 5 }),
        frameRate: 12,
        repeat: -1
      });
    }
    
    if (!anims.exists('player-jump')) {
      anims.create({
        key: 'player-jump',
        frames: anims.generateFrameNumbers('player', { start: 6, end: 8 }),
        frameRate: 10,
        repeat: 0
      });
    }
  }
  
  jump() {
    if (this.body.touching.down) {
      this.body.setVelocityY(this.jumpForce);
      this.isJumping = true;
      
      // Play jump animation if sprite has frames
      if (this.scene.textures.exists('player')) {
        this.play('player-jump', true);
      }
    }
  }
  
  update() {
    // Handle animations based on state
    if (this.body.touching.down) {
      if (this.isJumping) {
        this.isJumping = false;
      }
      
      // Play run animation if on ground
      if (this.scene.textures.exists('player')) {
        this.play('player-run', true);
      }
    }
    
    // Add trail effect
    if (Math.random() > 0.7) {
      this.createTrail();
    }
  }
  
  createTrail() {
    const particles = this.scene.add.particles(this.x, this.y, 'player', {
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.2, end: 0 },
      tint: 0x4f46e5,
      speed: 20,
      lifespan: 300,
      blendMode: 'ADD',
      quantity: 1
    });
    
    // Auto-destroy particles
    this.scene.time.delayedCall(300, () => {
      particles.destroy();
    });
  }
}