import Phaser from 'phaser';

// Physics helpers for game
export const physics = {
  // Check if two objects are colliding
  checkCollision: (obj1, obj2) => {
    return Phaser.Geom.Rectangle.Overlaps(
      obj1.getBounds(),
      obj2.getBounds()
    );
  },
  
  // Calculate vector between two points
  calculateVector: (x1, y1, x2, y2) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return { x: dx, y: dy };
  },
  
  // Calculate distance between two points
  calculateDistance: (x1, y1, x2, y2) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  },
  
  // Calculate direction angle in radians
  calculateAngle: (x1, y1, x2, y2) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.atan2(dy, dx);
  },
  
  // Apply gravity to an object
  applyGravity: (object, gravity, deltaTime) => {
    object.velocity.y += gravity * (deltaTime / 1000);
  },
  
  // Apply force to an object
  applyForce: (object, forceX, forceY) => {
    object.velocity.x += forceX / object.mass;
    object.velocity.y += forceY / object.mass;
  },
  
  // Apply jump force to an object
  applyJump: (object, jumpForce) => {
    object.velocity.y = jumpForce;
  },
  
  // Check if object is on ground
  isOnGround: (object, groundY) => {
    return object.y + object.height / 2 >= groundY;
  },
  
  // Constrain object to boundaries
  constrainToBounds: (object, leftBound, rightBound, topBound, bottomBound) => {
    // Left boundary
    if (object.x - object.width / 2 < leftBound) {
      object.x = leftBound + object.width / 2;
      object.velocity.x = 0;
    }
    
    // Right boundary
    if (object.x + object.width / 2 > rightBound) {
      object.x = rightBound - object.width / 2;
      object.velocity.x = 0;
    }
    
    // Top boundary
    if (object.y - object.height / 2 < topBound) {
      object.y = topBound + object.height / 2;
      object.velocity.y = 0;
    }
    
    // Bottom boundary
    if (object.y + object.height / 2 > bottomBound) {
      object.y = bottomBound - object.height / 2;
      object.velocity.y = 0;
      object.isOnGround = true;
    } else {
      object.isOnGround = false;
    }
  },
  
  // Create motion trail for an object
  createMotionTrail: (scene, object, trailLength = 5, alpha = 0.5) => {
    const trail = [];
    
    // Store previous positions
    const updateTrail = () => {
      trail.push({ x: object.x, y: object.y });
      
      // Limit trail length
      if (trail.length > trailLength) {
        trail.shift();
      }
    };
    
    // Draw trail
    const drawTrail = () => {
      for (let i = 0; i < trail.length; i++) {
        const point = trail[i];
        const trailAlpha = (i / trail.length) * alpha;
        
        // Draw trail point
        const trailPoint = scene.add.circle(
          point.x,
          point.y,
          object.width / 4,
          object.tint,
          trailAlpha
        );
        
        // Auto-destroy after a short time
        scene.time.delayedCall(100, () => {
          trailPoint.destroy();
        });
      }
    };
    
    return { updateTrail, drawTrail };
  }
};

export default physics;