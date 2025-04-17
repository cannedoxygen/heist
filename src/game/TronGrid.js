// src/game/TronGrid.js - With color-changing grid lines
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
      scrollSpeed: config.scrollSpeed || 2,                           // How fast lines move toward viewer
      lineWidth: config.lineWidth || 2,                               // Line thickness
      colorCycleSpeed: config.colorCycleSpeed || 0.0005               // Speed of color cycling
    };
    
    // Create graphics object for drawing
    this.graphics = scene.add.graphics();
    
    // Offset for scrolling effect
    this.scrollOffset = 0;
    
    // Color transition properties
    this.colorPhase = 0;
    
    // Store vertical line positions for proper horizontal line clamping
    this.verticalLines = {
      left: [],
      right: []
    };
    
    // Add event for window resize
    this.scene.scale.on('resize', this.handleResize, this);
  }
  
  // Handle resize events
  handleResize() {
    // Update any size-dependent variables
    this.config.horizonY = this.scene.cameras.main.height * 0.4;
    this.config.gridWidth = this.scene.cameras.main.width;
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
    
    // Update scroll offset for horizontal line movement
    this.scrollOffset = (this.scrollOffset + this.config.scrollSpeed) % 
                       (this.scene.cameras.main.height - this.config.horizonY);
    
    // Clear previous frame
    this.graphics.clear();
    
    // Reset vertical line positions
    this.verticalLines = { left: [], right: [] };
    
    // Draw the perspective grid
    this.drawVerticalLines();
    this.drawHorizontalLines();
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
  
  // Draw horizontal lines that create the perspective grid effect
  drawHorizontalLines() {
    const { width, height } = this.scene.cameras.main;
    const centerX = width / 2;
    const horizonY = this.config.horizonY;
    
    // Loop through horizontal lines, starting from horizon
    for (let i = 0; i <= this.config.horizontalLines; i++) {
      // Calculate the position, accounting for scroll offset
      let t = i / this.config.horizontalLines;
      const y = horizonY + (height - horizonY) * t + this.scrollOffset;
      
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
      
      // If the line is past the bottom, reset it to just above horizon
      if (y > height) {
        this.scrollOffset = 0;
      }
    }
  }
  
  // Set visibility of all components
  setVisible(visible) {
    this.graphics.setVisible(visible);
  }
  
  // Clean up resources when done
  destroy() {
    this.scene.scale.off('resize', this.handleResize, this);
    
    if (this.graphics) {
      this.graphics.destroy();
    }
  }
}

export default TronGrid;