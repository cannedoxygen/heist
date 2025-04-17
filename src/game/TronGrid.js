// src/game/TronGrid.js
// A class to create and manage a Tron-style perspective grid effect

export class TronGrid {
  constructor(scene, config = {}) {
    // Store the scene reference
    this.scene = scene;
    
    // Default configuration
    this.config = {
      horizonY: config.horizonY || scene.cameras.main.height * 0.4, // Position of horizon
      gridWidth: config.gridWidth || scene.cameras.main.width,       // Width of grid at bottom
      gridWidthAtHorizon: config.gridWidthAtHorizon || 60,           // Width of grid at horizon point
      color: config.color || 0x4f46e5,                               // Tron blue color
      lineAlpha: config.lineAlpha || 0.8,                            // Opacity of lines
      glowStrength: config.glowStrength || 1.5,                      // Glow effect strength
      horizontalLines: config.horizontalLines || 15,                 // Number of horizontal lines
      verticalLines: config.verticalLines || 9,                      // Number of vertical lines per side
      scrollSpeed: config.scrollSpeed || 2,                          // How fast lines move toward viewer
      lineWidth: config.lineWidth || 2                               // Line thickness
    };
    
    // Create graphics object for drawing
    this.graphics = scene.add.graphics();
    
    // Offset for scrolling effect
    this.scrollOffset = 0;
  }
  
  // Main update method - call this in your scene's update
  update(delta) {
    // Update scroll offset based on scroll speed
    this.scrollOffset = (this.scrollOffset + this.config.scrollSpeed) % 
                       (this.scene.cameras.main.height - this.config.horizonY);
    
    // Clear previous frame
    this.graphics.clear();
    
    // Set line style with glow
    this.graphics.lineStyle(this.config.lineWidth, this.config.color, this.config.lineAlpha);
    
    // Draw the perspective grid
    this.drawVerticalLines();
    this.drawHorizontalLines();
  }
  
  // Draw the vertical lines that converge at the vanishing point
  drawVerticalLines() {
    const { width, height } = this.scene.cameras.main;
    const centerX = width / 2;
    const horizonY = this.config.horizonY;
    
    // Draw center line
    this.graphics.beginPath();
    this.graphics.moveTo(centerX, horizonY);
    this.graphics.lineTo(centerX, height);
    this.graphics.strokePath();
    
    // Draw lines that recede to horizon point
    for (let i = 1; i <= this.config.verticalLines; i++) {
      // Calculate right-side line position at bottom
      const rightPos = centerX + (this.config.gridWidth / 2) * (i / this.config.verticalLines);
      // Calculate left-side line position at bottom
      const leftPos = centerX - (this.config.gridWidth / 2) * (i / this.config.verticalLines);
      
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
      const lineWidth = this.config.gridWidthAtHorizon + 
                       (this.config.gridWidth - this.config.gridWidthAtHorizon) * perspectiveRatio;
      
      // Draw the horizontal line
      this.graphics.beginPath();
      this.graphics.moveTo(centerX - lineWidth / 2, y);
      this.graphics.lineTo(centerX + lineWidth / 2, y);
      this.graphics.strokePath();
      
      // If the line is past the bottom, reset it to just above horizon
      if (y > height) {
        this.scrollOffset = 0;
      }
    }
  }
  
  // Add a post-process glow effect (if your renderer supports it)
  addGlowEffect() {
    if (this.scene.renderer && this.scene.renderer.pipelines) {
      try {
        // Try to add a glow pipeline if available
        const pipeline = this.scene.renderer.pipelines.get('GlowPipeline');
        if (pipeline) {
          this.graphics.setPipeline('GlowPipeline', { 
            glowStrength: this.config.glowStrength, 
            glowColor: this.config.color 
          });
        }
      } catch (e) {
        console.log('Glow pipeline not available');
      }
    }
  }
  
  // Set visibility
  setVisible(visible) {
    this.graphics.setVisible(visible);
  }
  
  // Clean up resources when done
  destroy() {
    if (this.graphics) {
      this.graphics.destroy();
    }
  }
}

export default TronGrid;