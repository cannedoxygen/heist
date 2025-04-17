// src/game/TronGrid.js
import Phaser from 'phaser';

export class TronGrid {
  constructor(scene, config = {}) {
    // Store the scene reference
    this.scene = scene;
    
    // Default configuration
    this.config = {
      horizonY: config.horizonY || scene.cameras.main.height * 0.4,  // Position of horizon
      gridWidth: config.gridWidth || scene.cameras.main.width,        // Width of grid at bottom
      gridWidthAtHorizon: config.gridWidthAtHorizon || 60,            // Width of grid at horizon point
      baseColor: config.baseColor || 0x4f46e5,                        // Purple base color
      accentColor: config.accentColor || 0xf472b6,                    // Pink accent color
      thirdColor: config.thirdColor || 0x34d399,                      // Green third color
      lineAlpha: config.lineAlpha || 0.8,                             // Opacity of lines
      horizontalLines: config.horizontalLines || 15,                  // Number of horizontal lines
      verticalLines: config.verticalLines || 9,                       // Number of vertical lines per side
      scrollSpeed: config.scrollSpeed || 1,                           // Initial scroll speed 
      lineWidth: config.lineWidth || 2,                               // Line thickness
      colorCycleSpeed: config.colorCycleSpeed || 0.0005,              // Speed of color cycling
      sideEffectIntensity: config.sideEffectIntensity || 0.5          // Intensity of side effects (0-1)
    };
    
    // Store base scroll speed to use as a reference
    this.baseScrollSpeed = this.config.scrollSpeed;
    
    // Current speed multiplier (will be updated by game)
    this.speedMultiplier = 1.0;
    
    // Create graphics object for drawing the main grid
    this.graphics = scene.add.graphics();
    
    // Create graphics for side effects
    this.sideEffects = scene.add.graphics();
    this.sideEffects.setDepth(-1); // Behind main grid
    
    // Create graphics for sunset effects
    this.skyGradient = scene.add.graphics();
    this.skyGradient.setDepth(-10);
    
    this.sunGraphics = scene.add.graphics();
    this.sunGraphics.setDepth(-5);
    
    this.linesGraphics = scene.add.graphics();
    this.linesGraphics.setDepth(-4);
    
    // Offset for scrolling effect - separate for horizontal and side effects
    this.scrollOffset = 0;
    this.sideScrollOffset = 0;
    
    // Color transition properties
    this.colorPhase = 0;
    
    // Store vertical line positions for proper horizontal line clamping
    this.verticalLines = {
      left: [],
      right: []
    };
    
    // Side effect particles
    this.sideParticles = [];
    this.createSideParticles();
    
    // Add event for window resize
    this.scene.scale.on('resize', this.handleResize, this);
  }
  
  // Method to update the grid speed based on game speed
  setSpeedMultiplier(multiplier) {
    this.speedMultiplier = multiplier;
    
    // Also update particle speeds
    this.updateParticleSpeeds();
  }
  
  // Update particle speeds based on current speed multiplier
  updateParticleSpeeds() {
    for (let i = 0; i < this.sideParticles.length; i++) {
      const particle = this.sideParticles[i];
      // Update speed based on base speed and current multiplier
      const baseSpeed = 0.001 + Math.random() * 0.003 + (particle.depth * 0.002);
      particle.speed = baseSpeed * this.speedMultiplier;
    }
  }
  
  // Handle resize events
  handleResize() {
    // Update any size-dependent variables
    this.config.horizonY = this.scene.cameras.main.height * 0.4;
    this.config.gridWidth = this.scene.cameras.main.width;
    
    // Recreate side particles for new dimensions
    this.sideParticles = [];
    this.createSideParticles();
  }
  
  // Create side particles for enhanced side effects
  createSideParticles() {
    const { width, height } = this.scene.cameras.main;
    const horizonY = this.config.horizonY;
    
    // Number of particles
    const numParticles = 30;
    
    for (let i = 0; i < numParticles; i++) {
      // Random position within view space
      const depth = Math.random(); // 0 = horizon, 1 = closest
      const side = Math.random() > 0.5 ? 'left' : 'right';
      const yPos = horizonY + (height - horizonY) * Math.pow(depth, 1.5); // Non-linear for perspective
      
      // Calculate X based on side and grid width at that depth
      const perspectiveRatio = (yPos - horizonY) / (height - horizonY);
      const gridWidth = this.config.gridWidthAtHorizon + 
                      (this.config.gridWidth - this.config.gridWidthAtHorizon) * perspectiveRatio;
      const centerX = width / 2;
      
      // Position outside the grid lines but within view
      const edgeOffset = 20 + Math.random() * 60; // Random offset from edge
      const xPos = side === 'left' 
        ? centerX - (gridWidth / 2) - edgeOffset * depth // Scale offset with depth
        : centerX + (gridWidth / 2) + edgeOffset * depth;
      
      // Random color from our color palette with distance-based alpha
      const colorChoice = Math.floor(Math.random() * 3);
      let color;
      switch (colorChoice) {
        case 0: color = this.config.baseColor; break;
        case 1: color = this.config.accentColor; break;
        case 2: color = this.config.thirdColor; break;
      }
      
      // Create particle with speed affected by multiplier
      const baseSpeed = 0.001 + Math.random() * 0.003 + (depth * 0.002);
      this.sideParticles.push({
        x: xPos,
        y: yPos,
        depth: depth,
        side: side,
        color: color,
        size: 1 + Math.random() * 3 + (depth * 2), // Larger as they get closer
        speed: baseSpeed * this.speedMultiplier, // Apply current speed multiplier
      });
    }
  }
  
  // Draw vaporwave sunset at the horizon
  drawVaporwaveSunset() {
    const { width, height } = this.scene.cameras.main;
    const horizonY = this.config.horizonY;
    
    // Clear previous frame
    this.skyGradient.clear();
    this.sunGraphics.clear();
    this.linesGraphics.clear();
    
    // Create a gradient for the sky
    // Define sunset gradient colors (vaporwave palette)
    const colors = [
      { stop: 0.0, color: 0xff1493 },  // Deep pink at top
      { stop: 0.3, color: 0xff00ff },  // Magenta 
      { stop: 0.5, color: 0x9400d3 },  // Purple
      { stop: 0.7, color: 0x0000ff },  // Blue
      { stop: 1.0, color: 0x00bfff }   // Deep sky blue at horizon
    ];
    
    // Draw gradient sky by creating a series of colored horizontal lines
    const gradientHeight = horizonY;
    for (let i = 0; i < gradientHeight; i++) {
      const ratio = i / gradientHeight;
      
      // Find color for this y-position by interpolating between stops
      let color;
      for (let j = 0; j < colors.length - 1; j++) {
        if (ratio >= colors[j].stop && ratio <= colors[j+1].stop) {
          const t = (ratio - colors[j].stop) / (colors[j+1].stop - colors[j].stop);
          const c1 = colors[j].color;
          const c2 = colors[j+1].color;
          
          // Extract RGB components
          const r1 = (c1 >> 16) & 0xFF;
          const g1 = (c1 >> 8) & 0xFF;
          const b1 = c1 & 0xFF;
          
          const r2 = (c2 >> 16) & 0xFF;
          const g2 = (c2 >> 8) & 0xFF;
          const b2 = c2 & 0xFF;
          
          // Interpolate
          const r = Math.floor(r1 + t * (r2 - r1));
          const g = Math.floor(g1 + t * (g2 - g1));
          const b = Math.floor(b1 + t * (b2 - b1));
          
          // Recreate color
          color = (r << 16) | (g << 8) | b;
          break;
        }
      }
      
      // Draw horizontal line of this color
      this.skyGradient.lineStyle(1, color, 1);
      this.skyGradient.beginPath();
      this.skyGradient.moveTo(0, i);
      this.skyGradient.lineTo(width, i);
      this.skyGradient.strokePath();
    }
    
    // Sun position
    const sunX = width / 2;
    const sunY = horizonY - horizonY/4;
    const sunRadius = Math.min(width, height) * 0.15;
    
    // Draw sun (simplified approach without gradient for compatibility)
    // Draw layers of circles with different colors and sizes for a gradient-like effect
    const sunLayers = [
      { radius: sunRadius * 1.0, color: 0xff007f, alpha: 0.7 },  // Hot pink outer
      { radius: sunRadius * 0.8, color: 0xff66b2, alpha: 0.8 },  // Pink
      { radius: sunRadius * 0.6, color: 0xffff00, alpha: 0.9 },  // Yellow
      { radius: sunRadius * 0.3, color: 0xffffff, alpha: 1.0 }   // White core
    ];
    
    // Draw sun layers from outer to inner
    for (const layer of sunLayers) {
      this.sunGraphics.fillStyle(layer.color, layer.alpha);
      this.sunGraphics.fillCircle(sunX, sunY, layer.radius);
    }
    
    // Draw horizontal sun lines (retro-style)
    // Draw horizontal lines
    const numLines = 10;
    const lineSpacing = horizonY / numLines;
    
    for (let i = 0; i < numLines; i++) {
      const y = i * lineSpacing;
      const alpha = 0.3 - (i / numLines) * 0.3; // Fade as lines go up
      
      this.linesGraphics.lineStyle(2, 0xff00ff, alpha);
      this.linesGraphics.beginPath();
      this.linesGraphics.moveTo(0, y);
      this.linesGraphics.lineTo(width, y);
      this.linesGraphics.strokePath();
    }
  }
  
  // Get changing color based on time and position
  getLineColor(position) {
    // Map position from 0-1 (horizon to player)
    const p = Math.min(1, Math.max(0, position));
    
    // Calculate color cycle offsets based on position to create "flow" effect
    const positionOffset = p * 2; // Higher values make the color flow faster from horizon
    
    // Calculate individual color phases
    const phase1 = (this.colorPhase + positionOffset) % (Math.PI * 2);
    const phase2 = (this.colorPhase + positionOffset + Math.PI * 2/3) % (Math.PI * 2);
    const phase3 = (this.colorPhase + positionOffset + Math.PI * 4/3) % (Math.PI * 2);
    
    // Convert phases to color weights (0-1)
    const t1 = (Math.sin(phase1) + 1) / 2;
    const t2 = (Math.sin(phase2) + 1) / 2;
    const t3 = (Math.sin(phase3) + 1) / 2;
    
    // Extract RGB components from hex colors
    const color1 = {
      r: (this.config.baseColor >> 16) & 0xFF,
      g: (this.config.baseColor >> 8) & 0xFF,
      b: this.config.baseColor & 0xFF
    };
    
    const color2 = {
      r: (this.config.accentColor >> 16) & 0xFF,
      g: (this.config.accentColor >> 8) & 0xFF,
      b: this.config.accentColor & 0xFF
    };
    
    const color3 = {
      r: (this.config.thirdColor >> 16) & 0xFF,
      g: (this.config.thirdColor >> 8) & 0xFF,
      b: this.config.thirdColor & 0xFF
    };
    
    // Normalize weights to ensure they sum to 1
    const sum = t1 + t2 + t3;
    const w1 = t1 / sum;
    const w2 = t2 / sum;
    const w3 = t3 / sum;
    
    // Interpolate between the three colors
    const r = Math.floor(color1.r * w1 + color2.r * w2 + color3.r * w3);
    const g = Math.floor(color1.g * w1 + color2.g * w2 + color3.g * w3);
    const b = Math.floor(color1.b * w1 + color2.b * w2 + color3.b * w3);
    
    // Convert back to hex
    return (r << 16) | (g << 8) | b;
  }
  
  // Main update method - call this in your scene's update
  update(delta) {
    // Update color phase for flowing color effect
    this.colorPhase += this.config.colorCycleSpeed * delta;
    
    // Calculate current scroll speed based on base speed and multiplier
    const currentScrollSpeed = this.baseScrollSpeed * this.speedMultiplier;
    
    // Update scroll offset for horizontal line movement
    // Use a small value for smooth continuous movement, modified by speed multiplier
    this.scrollOffset = (this.scrollOffset + currentScrollSpeed * 0.005) % 1;
    
    // Update side effect particles
    this.updateSideParticles(delta);
    
    // Clear previous frame for grid
    this.graphics.clear();
    this.sideEffects.clear();
    
    // Draw vaporwave sunset
    this.drawVaporwaveSunset();
    
    // Reset vertical line positions
    this.verticalLines = { left: [], right: [] };
    
    // Draw the perspective grid
    this.drawVerticalLines();
    this.drawHorizontalLines();
    this.drawSideEffects();
  }
  
  // Draw the vertical lines that converge at the vanishing point
  drawVerticalLines() {
    const { width, height } = this.scene.cameras.main;
    const centerX = width / 2;
    const horizonY = this.config.horizonY;
    
    // Store vertical line positions for proper horizontal line clamping
    this.verticalLines.left = [centerX];
    this.verticalLines.right = [centerX];
    
    // Draw center line with color
    const centerColor = this.getLineColor(1.0);
    this.graphics.lineStyle(this.config.lineWidth, centerColor, this.config.lineAlpha);
    this.graphics.beginPath();
    this.graphics.moveTo(centerX, horizonY);
    this.graphics.lineTo(centerX, height);
    this.graphics.strokePath();
    
    // Draw lines that recede to horizon point
    for (let i = 1; i <= this.config.verticalLines; i++) {
      // Calculate positions
      const posRatio = i / this.config.verticalLines;
      const rightPos = centerX + (this.config.gridWidth / 2) * posRatio;
      const leftPos = centerX - (this.config.gridWidth / 2) * posRatio;
      
      // Store these positions for horizontal line clamping
      this.verticalLines.right.push(rightPos);
      this.verticalLines.left.push(leftPos);
      
      // Get color for this vertical line
      const vertColor = this.getLineColor(posRatio);
      
      // Set line style with color
      this.graphics.lineStyle(this.config.lineWidth, vertColor, this.config.lineAlpha);
      
      // Draw right-side line
      this.graphics.beginPath();
      this.graphics.moveTo(centerX, horizonY);
      this.graphics.lineTo(rightPos, height);
      this.graphics.strokePath();
      
      // Draw left-side line
      this.graphics.beginPath();
      this.graphics.moveTo(centerX, horizonY);
      this.graphics.lineTo(leftPos, height);
      this.graphics.strokePath();
    }
    
    // Sort the vertical line positions for proper boundary checking
    this.verticalLines.left.sort((a, b) => a - b);
    this.verticalLines.right.sort((a, b) => a - b);
  }
  
  // Draw horizontal lines that move toward the player
  drawHorizontalLines() {
    const { width, height } = this.scene.cameras.main;
    const centerX = width / 2;
    const horizonY = this.config.horizonY;
    
    // Number of horizontal lines to draw
    const numLines = this.config.horizontalLines;
    
    // Loop through horizontal lines - these will move toward player
    for (let i = 0; i <= numLines; i++) {
      // Calculate a position value from 0 (horizon) to 1 (bottom)
      // Apply scrollOffset to create movement
      let t = i / numLines;
      
      // Apply the scrollOffset to t, which will make lines move toward the player
      t = (t + this.scrollOffset) % 1;
      
      // Use a non-linear (quadratic or cubic) function to create the illusion
      // of lines moving faster as they get closer to the player
      const perspectiveT = Math.pow(t, 2); // Quadratic for stronger perspective
      
      // Calculate Y position with perspective
      const y = horizonY + (height - horizonY) * perspectiveT;
      
      // Skip if above horizon
      if (y < horizonY) continue;
      
      // Calculate perspective width at this y position
      const perspectiveRatio = (y - horizonY) / (height - horizonY);
      
      // Get color for this horizontal line
      const lineColor = this.getLineColor(perspectiveRatio);
      
      // Calculate distance-based alpha (fade in from horizon)
      const distanceAlpha = Math.min(1, perspectiveRatio * 2);
      
      // Set line style with color and alpha
      this.graphics.lineStyle(
        this.config.lineWidth, 
        lineColor, 
        this.config.lineAlpha * distanceAlpha
      );
      
      // Calculate horizontal line bounds
      let leftBound, rightBound;
      
      // Calculate where vertical lines intersect this y level
      if (this.verticalLines.left.length > 0 && this.verticalLines.right.length > 0) {
        // Calculate x positions based on the farthest vertical lines
        leftBound = this.verticalLines.left[0];
        rightBound = this.verticalLines.right[this.verticalLines.right.length - 1];
      } else {
        // Fallback if vertical lines aren't stored
        const gridWidth = this.config.gridWidthAtHorizon + 
                       (this.config.gridWidth - this.config.gridWidthAtHorizon) * perspectiveRatio;
        leftBound = centerX - gridWidth / 2;
        rightBound = centerX + gridWidth / 2;
      }
      
      // Draw the horizontal line between vertical boundaries
      this.graphics.beginPath();
      this.graphics.moveTo(leftBound, y);
      this.graphics.lineTo(rightBound, y);
      this.graphics.strokePath();
    }
  }
  
  // Update side particles
  updateSideParticles(delta) {
    const { height } = this.scene.cameras.main;
    const horizonY = this.config.horizonY;
    
    // Update each particle
    for (let i = 0; i < this.sideParticles.length; i++) {
      const particle = this.sideParticles[i];
      
      // Move particle depth (toward player)
      particle.depth += particle.speed * delta;
      
      // If particle passed player, reset it back to horizon
      if (particle.depth > 1) {
        // Reset depth
        particle.depth = 0;
        
        // Randomize side
        particle.side = Math.random() > 0.5 ? 'left' : 'right';
        
        // Reset size
        particle.size = 1 + Math.random() * 3;
        
        // Reset speed based on current game speed
        const baseSpeed = 0.001 + Math.random() * 0.003;
        particle.speed = baseSpeed * this.speedMultiplier;
      }
      
      // Calculate new Y position based on depth
      particle.y = horizonY + (height - horizonY) * Math.pow(particle.depth, 1.5);
      
      // Calculate X position based on side and depth
      const { width } = this.scene.cameras.main;
      const centerX = width / 2;
      const perspectiveRatio = (particle.y - horizonY) / (height - horizonY);
      const gridWidth = this.config.gridWidthAtHorizon + 
                      (this.config.gridWidth - this.config.gridWidthAtHorizon) * perspectiveRatio;
      
      // Position outside the grid
      const edgeOffset = 20 + Math.random() * 60;
      particle.x = particle.side === 'left' 
        ? centerX - (gridWidth / 2) - edgeOffset * particle.depth
        : centerX + (gridWidth / 2) + edgeOffset * particle.depth;
    }
  }
  
  // Draw side effects (particles, streaks, etc.)
  drawSideEffects() {
    // Draw side particles
    for (let i = 0; i < this.sideParticles.length; i++) {
      const particle = this.sideParticles[i];
      
      // Calculate alpha based on depth
      const alpha = Math.min(0.8, particle.depth * 1.2);
      
      // Calculate size based on depth (bigger as they get closer)
      const displaySize = particle.size * (0.5 + particle.depth * 1.5);
      
      // Draw particle
      this.sideEffects.fillStyle(particle.color, alpha);
      
      // Draw as rectangle for streak effect
      if (particle.depth > 0.4) { // Only create streaks for closer particles
        // Calculate streak length based on depth and speed
        // Make streaks longer when speed is higher
        const streakLength = displaySize * 5 * particle.depth * (particle.speed * 500);
        
        // Draw streak (elongated rectangle)
        this.sideEffects.fillRect(
          particle.x - (particle.side === 'left' ? 0 : streakLength), 
          particle.y - displaySize/2,
          streakLength,
          displaySize
        );
      } else {
        // Draw as circle for distant particles
        this.sideEffects.fillCircle(particle.x, particle.y, displaySize/2);
      }
    }
  }
  
  // Set visibility of all components
  setVisible(visible) {
    this.graphics.setVisible(visible);
    this.sideEffects.setVisible(visible);
    this.skyGradient.setVisible(visible);
    this.sunGraphics.setVisible(visible);
    this.linesGraphics.setVisible(visible);
  }
  
  // Clean up resources when done
  destroy() {
    this.scene.scale.off('resize', this.handleResize, this);
    
    if (this.graphics) {
      this.graphics.destroy();
    }
    
    if (this.sideEffects) {
      this.sideEffects.destroy();
    }
    
    if (this.skyGradient) {
      this.skyGradient.destroy();
    }
    
    if (this.sunGraphics) {
      this.sunGraphics.destroy();
    }
    
    if (this.linesGraphics) {
      this.linesGraphics.destroy();
    }
    
    // Clear any references
    this.sideParticles = [];
  }
}

export default TronGrid;