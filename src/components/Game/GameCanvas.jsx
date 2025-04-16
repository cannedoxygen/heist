import React, { useEffect, useRef, useContext } from 'react';
import { GameContext } from '../../context/GameContext';
import { gameService } from '../../services/gameService';
import './GameCanvas.css';

const GameCanvas = () => {
  const { 
    updateScore, 
    endGame,
    isPlaying,
    volume,
    isMuted
  } = useContext(GameContext);
  
  const gameContainerRef = useRef(null);
  const gameInitializedRef = useRef(false);
  
  // Initialize game engine
  useEffect(() => {
    console.log("GameCanvas mounted");
    
    // Debug the DOM to make sure container exists
    const containerElement = document.getElementById('game-canvas-container');
    console.log("Container element exists:", !!containerElement);
    
    if (containerElement) {
      console.log("Container dimensions:", containerElement.offsetWidth, "x", containerElement.offsetHeight);
    }
    
    // Only initialize once
    if (!gameInitializedRef.current) {
      console.log("Initializing game engine");
      
      const handleScoreUpdate = (score) => {
        console.log("Score update:", score);
        updateScore(score);
      };
      
      const handleGameOver = (finalScore) => {
        console.log("Game over with score:", finalScore);
        endGame();
      };
      
      // Small delay to ensure the container is fully rendered
      setTimeout(() => {
        try {
          console.log("Creating game instance");
          gameService.initialize(
            'game-canvas-container',
            handleScoreUpdate,
            handleGameOver
          );
          gameInitializedRef.current = true;
          console.log("Game initialized successfully");
          
          // If already playing, start the game
          if (isPlaying) {
            console.log("Auto-starting game");
            gameService.startGame();
          }
        } catch (error) {
          console.error("Error initializing game:", error);
        }
      }, 100);
    }
    
    // Cleanup on unmount
    return () => {
      console.log("GameCanvas unmounting");
      gameService.destroy();
      gameInitializedRef.current = false;
    };
  }, [updateScore, endGame]);
  
  // Handle game state changes
  useEffect(() => {
    console.log("Game state changed, isPlaying:", isPlaying);
    if (gameInitializedRef.current) {
      if (isPlaying) {
        console.log("Starting game");
        gameService.startGame();
      } else {
        console.log("Stopping game");
        gameService.stopGame();
      }
    }
  }, [isPlaying]);
  
  // Update volume when it changes
  useEffect(() => {
    console.log("Volume changed:", volume);
    if (gameInitializedRef.current) {
      gameService.setVolume(volume);
    }
  }, [volume]);
  
  // Update mute state when it changes
  useEffect(() => {
    console.log("Mute state changed:", isMuted);
    if (gameInitializedRef.current) {
      gameService.toggleMute();
    }
  }, [isMuted]);
  
  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (gameInitializedRef.current) {
        gameService.resize();
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  return (
    <div 
      id="game-canvas-container" 
      ref={gameContainerRef} 
      className="game-canvas-container"
      style={{ width: '100%', height: '100%', minHeight: '400px' }}
    >
      {/* Game canvas will be rendered here by Phaser */}
      {!gameInitializedRef.current && (
        <div className="game-loading">
          <p>Loading game...</p>
        </div>
      )}
    </div>
  );
};

export default GameCanvas;