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
    
    // Animation state
    this.isJumping = false;
    this.isRunning = false;
    
    // Check if texture has animation frames before creating animations
    // This helps avoid the error when no proper spritesheet is available
    if (this.scene.textures.exists('player')) {
      const texture = this.scene.textures.get('player');
      // Only create animations if the texture has frames (is a spritesheet)
      if (texture.frameTotal > 1) {
        this.createAnimations();
      } else {
        console.log('Player texture exists but is not a spritesheet, skipping animations');
      }
    }
  }
  
  createAnimations() {
    try {
      // Check if animations already exist to avoid duplicate creation
      const anims = this.scene.anims;
      
      if (!anims.exists('player-run')) {
        console.log('Creating player-run animation');
        anims.create({
          key: 'player-run',
          frames: anims.generateFrameNumbers('player', { start: 0, end: 5 }),
          frameRate: 12,
          repeat: -1
        });
      }
      
      if (!anims.exists('player-jump')) {
        console.log('Creating player-jump animation');
        anims.create({
          key: 'player-jump',
          frames: anims.generateFrameNumbers('player', { start: 6, end: 8 }),
          frameRate: 10,
          repeat: 0
        });
      }
      
      // Log success
      console.log('Player animations created successfully');
    } catch (e) {
      console.error('Error creating player animations:', e);
    }
  }
  
  jump() {
    if (this.body.touching.down) {
      this.body.setVelocityY(this.jumpForce);
      this.isJumping = true;
      
      // Try to play jump animation only if it exists
      try {
        if (this.scene.anims.exists('player-jump')) {
          this.play('player-jump', true);
        }
      } catch (e) {
        console.error('Error playing jump animation:', e);
      }
    }
  }
  
  update() {
    // Handle animations based on state
    try {
      if (this.body.touching.down) {
        if (this.isJumping) {
          this.isJumping = false;
        }
        
        // Play run animation if on ground and animation exists
        if (!this.isRunning && this.scene.anims.exists('player-run')) {
          this.play('player-run', true);
          this.isRunning = true;
        }
      } else {
        // In the air
        this.isRunning = false;
      }
    } catch (e) {
      console.error('Error in player update animation:', e);
    }
    
    // Add trail effect
    if (Math.random() > 0.7) {
      this.createTrail();
    }
  }
  
  createTrail() {
    try {
      // Check if particles system exists
      if (this.scene.particles) {
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
      } else {
        // Fallback visual effect if particles system isn't available
        const trailEffect = this.scene.add.rectangle(
          this.x - 10, 
          this.y,
          10,
          10,
          0x4f46e5,
          0.3
        );
        
        // Fade out and destroy
        this.scene.tweens.add({
          targets: trailEffect,
          alpha: 0,
          duration: 200,
          onComplete: () => {
            trailEffect.destroy();
          }
        });
      }
    } catch (e) {
      console.error('Error creating player trail:', e);
    }
  }
}