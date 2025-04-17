import Phaser from 'phaser';

export class Player {
  constructor(scene, x, y) {
    this.scene = scene;
    
    // Player dimensions - 4x larger than original
    this.width = 160;
    this.height = 160;
    this.glowWidth = 240;
    this.glowHeight = 80;
    this.jumpEffectWidth = 320;
    this.jumpEffectHeight = 80;
    
    // Create sprite
    if (scene.textures.exists('player')) {
      this.sprite = scene.add.sprite(x, y, 'player');
      this.sprite.setDisplaySize(this.width, this.height);
    } else {
      // Fallback to rectangle if texture doesn't exist
      this.sprite = scene.add.rectangle(x, y, this.width, this.height, 0x4f46e5);
    }
    
    // Set sprite properties
    this.sprite.setDepth(50);
    
    // Player state
    this.isJumping = false;
    this.lane = 1; // Default to center lane
    
    // Jump properties
    this.jumpHeight = 100;
    this.jumpDuration = 500; // ms
    
    // Create trail effect
    this.createTrailEffect();
    
    // Add glow effect
    this.addGlowEffect();
  }
  
  createTrailEffect() {
    // Create trail emitter if we have the particle system
    if (this.scene.particles) {
      try {
        this.trailEmitter = this.scene.add.particles(this.sprite.x, this.sprite.y, {
          frame: ['player'],
          lifespan: 500,
          scale: { start: 0.5, end: 0 },
          alpha: { start: 0.3, end: 0 },
          speed: 20,
          quantity: 1,
          frequency: 100
        });
        
        // Update emitter position on each frame
        this.scene.events.on('update', () => {
          this.trailEmitter.setPosition(this.sprite.x, this.sprite.y + 10);
        });
      } catch (e) {
        console.error('Error creating trail effect:', e);
      }
    } else {
      // Simple trail effect as fallback
      this.scene.time.addEvent({
        delay: 100,
        callback: this.createTrailParticle,
        callbackScope: this,
        loop: true
      });
    }
  }
  
  createTrailParticle() {
    // Only create trail when moving or jumping
    if (this.isJumping) {
      const particle = this.scene.add.rectangle(
        this.sprite.x,
        this.sprite.y + 10,
        40,
        40,
        0x4f46e5,
        0.3
      );
      particle.setDepth(40);
      
      // Fade out and destroy
      this.scene.tweens.add({
        targets: particle,
        alpha: 0,
        scaleX: 0.5,
        scaleY: 0.5,
        y: particle.y + 20,
        duration: 300,
        onComplete: () => {
          particle.destroy();
        }
      });
    }
  }
  
  addGlowEffect() {
    // Add a glow behind the player
    try {
      this.glow = this.scene.add.ellipse(
        this.sprite.x,
        this.sprite.y + 15,
        this.glowWidth,
        this.glowHeight,
        0x4f46e5,
        0.3
      );
      this.glow.setDepth(45);
      
      // Pulsing animation for glow
      this.scene.tweens.add({
        targets: this.glow,
        scaleX: 1.2,
        scaleY: 1.2,
        alpha: 0.5,
        duration: 1000,
        yoyo: true,
        repeat: -1
      });
      
      // Update glow position
      this.scene.events.on('update', () => {
        this.glow.x = this.sprite.x;
        this.glow.y = this.sprite.y + 15;
      });
    } catch (e) {
      console.error('Error creating glow effect:', e);
    }
  }
  
  jump() {
    if (this.isJumping) return;
    
    // Set jumping flag
    this.isJumping = true;
    
    // Play jump sound
    if (this.scene.sound && this.scene.sound.get('jump')) {
      this.scene.sound.play('jump', { volume: 0.5 });
    }
    
    // Create jump tween
    this.scene.tweens.add({
      targets: this.sprite,
      y: this.sprite.y - this.jumpHeight,
      duration: this.jumpDuration / 2,
      ease: 'Sine.easeOut',
      yoyo: true,
      onComplete: () => {
        this.isJumping = false;
      }
    });
    
    // Move glow with jump
    if (this.glow) {
      this.scene.tweens.add({
        targets: this.glow,
        y: this.glow.y - this.jumpHeight,
        duration: this.jumpDuration / 2,
        ease: 'Sine.easeOut',
        yoyo: true
      });
    }
    
    // Create jump effect
    this.createJumpEffect();
  }
  
  createJumpEffect() {
    // Create a jump shadow effect
    const jumpEffect = this.scene.add.ellipse(
      this.sprite.x,
      this.sprite.y + 35,
      this.jumpEffectWidth,
      this.jumpEffectHeight,
      0x4f46e5,
      0.6
    );
    jumpEffect.setDepth(40);
    
    // Animate the jump effect
    this.scene.tweens.add({
      targets: jumpEffect,
      scaleX: 1.5,
      scaleY: 0.5,
      alpha: 0,
      duration: 300,
      onComplete: () => {
        jumpEffect.destroy();
      }
    });
  }
  
  moveTo(laneIndex, laneX) {
    // Update current lane
    this.lane = laneIndex;
    
    // Create tween to move player
    this.scene.tweens.add({
      targets: this.sprite,
      x: laneX,
      duration: 200,
      ease: 'Sine.easeInOut'
    });
    
    // Move glow with player
    if (this.glow) {
      this.scene.tweens.add({
        targets: this.glow,
        x: laneX,
        duration: 200,
        ease: 'Sine.easeInOut'
      });
    }
  }
  
  update() {
    // Add any per-frame updates here
    if (Math.random() > 0.95 && !this.isJumping) {
      // Occasionally play idle animation
      this.playIdleAnimation();
    }
  }
  
  playIdleAnimation() {
    // Simple idle animation
    this.scene.tweens.add({
      targets: this.sprite,
      y: this.sprite.y - 5,
      duration: 300,
      yoyo: true
    });
  }
  
  destroy() {
    // Clean up all elements
    if (this.trailEmitter) {
      this.trailEmitter.destroy();
    }
    
    if (this.glow) {
      this.glow.destroy();
    }
    
    this.sprite.destroy();
  }
}