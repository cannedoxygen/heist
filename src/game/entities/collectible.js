// src/game/entities/collectible.js - FIXED VERSION

import Phaser from 'phaser';

export class Collectible {
  constructor(scene, x, y, z, lane) {
    this.scene = scene;
    this.z = z || 1000; // Z-distance (depth)
    this.lane = lane || 0.5; // Lane position (0-1)
    this.collected = false; // Track collection status
    this.destroyed = false; // Important flag to prevent double-processing
    
    // Base properties - 4x larger than original
    this.baseWidth = 80;
    this.baseHeight = 80;
    this.glowSize = 120;
    
    // Create sprite
    if (scene.textures.exists('data')) {
      this.sprite = scene.add.sprite(x, y, 'data');
      this.sprite.setTint(0x38bdf8); // Blue tint
    } else {
      // Fallback to rectangle
      this.sprite = scene.add.rectangle(x, y, 32, 32, 0x38bdf8);
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
        collected: false,
        destroyed: false
      });
    }
    
    // Add visual effects
    this.addVisualEffects();
  }
  
  addVisualEffects() {
    // Only add effects if not already collected or destroyed
    if (this.collected || this.destroyed) return;
    
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
      this.glow = this.scene.add.ellipse(
        this.sprite.x,
        this.sprite.y,
        this.glowSize,
        this.glowSize,
        0x38bdf8,
        0.3
      );
      this.glow.setDepth(29);
      
      // Pulse the glow
      this.scene.tweens.add({
        targets: this.glow,
        scaleX: 1.5,
        scaleY: 1.5,
        alpha: 0.5,
        duration: 1000,
        yoyo: true,
        repeat: -1
      });
      
      // Update glow position
      this.scene.events.on('update', () => {
        if (this.glow && this.sprite && !this.collected && !this.destroyed) {
          this.glow.x = this.sprite.x;
          this.glow.y = this.sprite.y;
        }
      });
      
      // Destroy glow when sprite is destroyed
      this.sprite.on('destroy', () => {
        if (this.glow) {
          this.glow.destroy();
          this.glow = null;
        }
      });
    } catch (e) {
      console.error('Could not create glow effect', e);
    }
  }
  
  // Method to properly collect the item
  collect() {
    // Prevent double collection
    if (this.collected || this.destroyed) return false;
    
    // Mark as collected
    this.collected = true;
    
    // Play collection sound if available
    if (this.scene.sound && this.scene.sound.get('collect')) {
      this.scene.sound.play('collect', { volume: 0.5 });
    }
    
    // Create collection particles
    this.createCollectParticles();
    
    // Properly hide sprite but don't destroy immediately to prevent visual glitches
    if (this.sprite) {
      this.sprite.visible = false;
    }
    
    // Remove glow effect
    if (this.glow) {
      this.glow.destroy();
      this.glow = null;
    }
    
    // Return true to indicate successful collection
    return true;
  }
  
  createCollectParticles() {
    // Create particles at sprite's position
    if (!this.sprite) return;
    
    const x = this.sprite.x;
    const y = this.sprite.y;
    
    // Calculate particle size based on screen dimensions
    const sceneWidth = this.scene.cameras.main.width;
    const sceneHeight = this.scene.cameras.main.height;
    const particleSize = Math.max(2, Math.min(sceneWidth, sceneHeight) * 0.01);
    
    // Create particles
    for (let i = 0; i < 15; i++) {
      const particle = this.scene.add.circle(x, y, particleSize, 0x38bdf8);
      particle.setAlpha(0.7);
      particle.setDepth(40);
      
      this.scene.tweens.add({
        targets: particle,
        x: x + Math.floor(Math.random() * 200) - 100,
        y: y + Math.floor(Math.random() * 200) - 100,
        alpha: 0,
        scale: 0,
        duration: 500,
        onComplete: () => {
          particle.destroy();
        }
      });
    }
    
    // Add floating score text
    const fontSize = Math.max(20, Math.min(sceneWidth, sceneHeight) * 0.04);
    const scorePopup = this.scene.add.text(x, y - 20, '+10', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: `${fontSize}px`,
      color: '#38bdf8'
    }).setOrigin(0.5);
    scorePopup.setDepth(45);
    
    // Animate score popup
    this.scene.tweens.add({
      targets: scorePopup,
      y: y - 120,
      alpha: 0,
      duration: 800,
      onComplete: () => {
        scorePopup.destroy();
      }
    });
  }
  
  update() {
    // Update logic if needed
  }
  
  destroy() {
    // Prevent double destruction
    if (this.destroyed) return;
    this.destroyed = true;
    
    // Remove glow
    if (this.glow) {
      this.glow.destroy();
      this.glow = null;
    }
    
    // Destroy sprite
    if (this.sprite) {
      this.sprite.destroy();
      this.sprite = null;
    }
    
    // Clean up tweens
    this.scene.tweens.killTweensOf(this.sprite);
    this.scene.tweens.killTweensOf(this.glow);
  }
}