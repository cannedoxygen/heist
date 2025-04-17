import Phaser from 'phaser';

export class Player {
  constructor(scene, x, y) {
    this.scene = scene;
    
    // Create sprite
    if (scene.textures.exists('player')) {
      this.sprite = scene.add.sprite(x, y, 'player');
    } else {
      // Fallback to rectangle if texture doesn't exist
      this.sprite = scene.add.rectangle(x, y, 40, 40, 0x4f46e5);
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
        10,
        10,
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
        60,
        20,
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
    
    // Add shadow effect during jump
    this.createJumpShadow();
  }
  
  createJumpShadow() {
    // Create a shadow underneath during jump
    const shadow = this.scene.add.ellipse(
      this.sprite.x,
      this.sprite.y + 20,
      30,
      10,
      0x000000,
      0.3
    );
    shadow.setDepth(20);
    
    // Fade out shadow as player goes higher
    this.scene.tweens.add({
      targets: shadow,
      scaleX: 0.5,
      scaleY: 0.5,
      alpha: 0.1,
      duration: this.jumpDuration / 2,
      yoyo: true,
      onComplete: () => {
        shadow.destroy();
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