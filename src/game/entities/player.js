// src/game/entities/player.js - Self-contained with input handling
import Phaser from 'phaser';

export class Player {
  constructor(scene, x, y, config = {}) {
    this.scene = scene;
    
    // Get screen dimensions for responsive sizing
    this.gameWidth = scene.cameras.main.width;
    this.gameHeight = scene.cameras.main.height;
    
    // Calculate responsive sizes
    this.calculateSizes();
    
    // Player state
    this.isJumping = false;
    this.jumpTween = null;
    this.lane = 1; // Default to center lane
    this.direction = 'right'; // Current sprite direction
    this.lastDirection = 'right'; 
    this.animationTimer = 0; // Timer for animation cycle
    this.animationDelay = 250; // Milliseconds between animation frames
    
    // Create sprite container
    this.container = scene.add.container(x, y);
    this.container.setDepth(50);
    
    // Create sprites
    this.createSprites();
    
    // Jump properties
    this.jumpHeight = Math.min(this.gameHeight * 0.25, 150); // Responsive jump height
    this.jumpDuration = 500; // ms
    this.startY = y; // Store initial Y position for safe landing
    
    // Create trail effect
    this.createTrailEffect();
    
    // Add glow effect
    this.addGlowEffect();
    
    // Start running animation cycle
    this.startRunningAnimation();
    
    // IMPORTANT: Setup our own input handlers directly in the Player class
    this.setupInputHandlers();
    
    // Setup update callback
    this.scene.events.on('update', (time, delta) => {
      this.update(time, delta);
    });
  }
  
  // Set up input handlers directly in the Player class
  setupInputHandlers() {
    // Jump on spacebar - direct input handling
    this.scene.input.keyboard.on('keydown-SPACE', this.handleJumpInput, this);
    
    // Also handle touch/click for mobile
    this.scene.input.on('pointerdown', this.handleJumpInput, this);
    
    console.log("Player input handlers initialized");
  }
  
  // Jump input handler
  handleJumpInput(event) {
    // Only respond to direct jump input if the game is active
    if (this.scene.game.isRunning) {
      console.log("Jump input received");
      this.jump();
    }
  }
  
  calculateSizes() {
    // Base size calculations using screen dimensions with 30% increase
    const baseSize = Math.min(this.gameHeight * 0.195, this.gameWidth * 0.156); // 30% bigger
    
    // Player dimensions
    this.width = baseSize;
    this.height = baseSize;
    
    // Effect sizes
    this.glowWidth = baseSize * 1.5;
    this.glowHeight = baseSize * 0.5;
    this.jumpEffectWidth = baseSize * 2;
    this.jumpEffectHeight = baseSize * 0.5;
    
    // Trail dimensions
    this.trailSize = baseSize * 0.3;
  }
  
  createSprites() {
    // Check if sprite assets exist
    const hasPlayerSprites = 
      this.scene.textures.exists('playerR') && 
      this.scene.textures.exists('playerL') && 
      this.scene.textures.exists('playerJ');
    
    if (hasPlayerSprites) {
      // Create all sprites but only show the default one
      this.spriteRight = this.scene.add.sprite(0, 0, 'playerR');
      this.spriteLeft = this.scene.add.sprite(0, 0, 'playerL');
      this.spriteJump = this.scene.add.sprite(0, 0, 'playerJ');
      
      // Set size for all sprites
      this.spriteRight.setDisplaySize(this.width, this.height);
      this.spriteLeft.setDisplaySize(this.width, this.height);
      this.spriteJump.setDisplaySize(this.width, this.height);
      
      // Add all sprites to container
      this.container.add([this.spriteRight, this.spriteLeft, this.spriteJump]);
      
      // Set initial visibility
      this.updateSpriteVisibility();
    } else {
      // Fallback to rectangles if textures don't exist
      console.warn('Player sprite assets not found! Using fallback shapes.');
      
      // Create different colored/shaped rectangles for each state
      this.spriteRight = this.scene.add.rectangle(0, 0, this.width, this.height, 0x4f46e5);
      this.spriteLeft = this.scene.add.rectangle(0, 0, this.width, this.height, 0x3730a3);
      this.spriteJump = this.scene.add.rectangle(0, 0, this.width, this.height, 0x818cf8);
      
      // Add to container
      this.container.add([this.spriteRight, this.spriteLeft, this.spriteJump]);
      
      // Set initial visibility
      this.updateSpriteVisibility();
    }
  }
  
  // Start the continuous running animation
  startRunningAnimation() {
    // Clear any existing animation timer
    if (this.animationEvent) {
      this.animationEvent.remove();
    }
    
    // Create a repeating timer to switch between L and R sprites
    this.animationEvent = this.scene.time.addEvent({
      delay: this.animationDelay,
      callback: this.toggleRunningSprite,
      callbackScope: this,
      loop: true
    });
  }
  
  // Toggle between left and right running sprites
  toggleRunningSprite() {
    // Don't change sprites during jump
    if (this.isJumping) return;
    
    // Switch direction
    this.direction = this.direction === 'right' ? 'left' : 'right';
    
    // Update visible sprite
    this.updateSpriteVisibility();
  }
  
  // Update which sprite is visible based on current state
  updateSpriteVisibility() {
    // Check if sprites exist
    if (!this.spriteRight || !this.spriteLeft || !this.spriteJump) return;
    
    // Hide all sprites first
    this.spriteRight.setVisible(false);
    this.spriteLeft.setVisible(false);
    this.spriteJump.setVisible(false);
    
    // Show the active sprite based on state
    if (this.isJumping) {
      // During jump, show jump sprite if available, or continue alternating
      if (this.direction === 'right') {
        this.spriteRight.setVisible(true);
      } else {
        this.spriteLeft.setVisible(true);
      }
    } else if (this.direction === 'right') {
      this.spriteRight.setVisible(true);
    } else {
      this.spriteLeft.setVisible(true);
    }
  }
  
  createTrailEffect() {
    // Create simple trail effect
    this.scene.time.addEvent({
      delay: 100,
      callback: this.createTrailParticle,
      callbackScope: this,
      loop: true
    });
  }
  
  createTrailParticle() {
    // Only create trail when moving or jumping
    if (this.isJumping) {
      const particle = this.scene.add.rectangle(
        this.container.x,
        this.container.y + 10,
        this.trailSize,
        this.trailSize,
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
        this.container.x,
        this.container.y + 15,
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
        this.glow.x = this.container.x;
        this.glow.y = this.container.y + 15;
      });
    } catch (e) {
      console.error('Error creating glow effect:', e);
    }
  }
  
  jump() {
    // Don't jump if already jumping
    if (this.isJumping) {
      console.log("Already jumping, ignoring jump request");
      return;
    }
    
    console.log("Jump initiated from Y:", this.container.y);
    
    // Set jumping flag
    this.isJumping = true;
    
    // Remember current direction state before jumping
    this.lastDirection = this.direction;
    
    // Kill any existing jump tween
    if (this.jumpTween) {
      this.jumpTween.stop();
      this.jumpTween = null;
    }
    
    // Update sprite to jumping state
    this.updateSpriteVisibility();
    
    // Play jump sound
    if (this.scene.sound && this.scene.sound.get('jump')) {
      this.scene.sound.play('jump', { volume: 0.5 });
    }
    
    // Create jump effect
    this.createJumpEffect();
    
    // Store original Y position
    const startY = this.container.y;
    const jumpHeight = this.jumpHeight;
    
    // Create jump tween for up movement
    this.jumpTween = this.scene.tweens.add({
      targets: this.container,
      y: startY - jumpHeight,
      duration: this.jumpDuration / 2,
      ease: 'Sine.easeOut',
      onComplete: () => {
        // Create a second tween for the descent
        this.scene.tweens.add({
          targets: this.container,
          y: startY,
          duration: this.jumpDuration / 2,
          ease: 'Sine.easeIn',
          onComplete: () => {
            console.log("Jump complete, returned to Y:", this.container.y);
            
            // Reset jump state after landing
            this.isJumping = false;
            this.jumpTween = null;
            
            // Update sprite visibility after landing
            this.updateSpriteVisibility();
          }
        });
      }
    });
    
    // Move glow with jump - separate up and down tweens
    if (this.glow) {
      this.scene.tweens.add({
        targets: this.glow,
        y: this.glow.y - jumpHeight,
        duration: this.jumpDuration / 2,
        ease: 'Sine.easeOut',
        onComplete: () => {
          this.scene.tweens.add({
            targets: this.glow,
            y: this.startY + 15, // Return to original position with offset
            duration: this.jumpDuration / 2,
            ease: 'Sine.easeIn'
          });
        }
      });
    }
  }
  
  createJumpEffect() {
    // Create a jump shadow effect
    const jumpEffect = this.scene.add.ellipse(
      this.container.x,
      this.container.y + 35,
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
      targets: this.container,
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
  
  // Emergency function to reset player position if stuck
  resetPosition() {
    // Stop any active tween
    if (this.jumpTween) {
      this.jumpTween.stop();
      this.jumpTween = null;
    }
    
    // Force player back to start Y position
    this.container.y = this.startY;
    this.isJumping = false;
    this.updateSpriteVisibility();
    
    // Also reset glow position
    if (this.glow) {
      this.glow.y = this.startY + 15;
    }
    
    console.log("Player position reset to ground level");
  }
  
  // Get player position
  getPosition() {
    return {
      x: this.container.x,
      y: this.container.y,
      width: this.width,
      height: this.height
    };
  }
  
  // Check if player is colliding with an object
  checkCollision(obj) {
    if (!obj || !obj.getBounds) return false;
    
    const playerBounds = new Phaser.Geom.Rectangle(
      this.container.x - this.width/2,
      this.container.y - this.height/2,
      this.width,
      this.height
    );
    
    return Phaser.Geom.Rectangle.Overlaps(playerBounds, obj.getBounds());
  }
  
  update(time, delta) {
    // Safety check - if player has been in a jump state too long, reset
    if (this.isJumping && time - this.animationTimer > 2000) {
      console.log("Jump timed out, resetting position");
      this.resetPosition();
    }
    
    // Continue to alternate running sprites even during jump
    if (this.isJumping && !this.jumpTween) {
      console.log("Jump state with no active tween, resetting");
      this.isJumping = false; // fix stuck jump state
      this.updateSpriteVisibility();
    }
  }
  
  destroy() {
    // Remove input handlers
    this.scene.input.keyboard.off('keydown-SPACE', this.handleJumpInput, this);
    this.scene.input.off('pointerdown', this.handleJumpInput, this);
    
    // Clean up all elements
    if (this.glow) {
      this.glow.destroy();
    }
    
    // Kill active tweens
    if (this.jumpTween) {
      this.jumpTween.stop();
    }
    
    // Stop animation timer
    if (this.animationEvent) {
      this.animationEvent.remove();
    }
    
    // Destroy all sprites
    if (this.spriteRight) this.spriteRight.destroy();
    if (this.spriteLeft) this.spriteLeft.destroy();
    if (this.spriteJump) this.spriteJump.destroy();
    
    // Remove update callback
    this.scene.events.off('update', this.update, this);
    
    // Destroy container
    this.container.destroy();
  }
}