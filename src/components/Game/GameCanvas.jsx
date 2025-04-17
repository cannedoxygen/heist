// src/components/Game/GameCanvas.jsx - UPDATED WITH RESPONSIVE SIZING
import React, { useEffect, useRef, useContext, useState } from 'react';
import { GameContext } from '../../context/GameContext';
import { gameService } from '../../services/gameService';
import './GameCanvas.css';

const GameCanvas = () => {
  const { 
    updateScore, 
    endGame,
    isPlaying,
    volume,
    isMuted,
    difficulty
  } = useContext(GameContext);
  
  const gameContainerRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Measure container size
  const measureContainer = () => {
    if (gameContainerRef.current) {
      const { offsetWidth, offsetHeight } = gameContainerRef.current;
      setContainerSize({ width: offsetWidth, height: offsetHeight });
      return { width: offsetWidth, height: offsetHeight };
    }
    return { width: 0, height: 0 };
  };
  
  // Initialize game engine once container is measured
  useEffect(() => {
    console.log("GameCanvas mounted");
    
    // First get container size
    const containerElement = document.getElementById('game-canvas-container');
    if (containerElement) {
      const { width, height } = measureContainer();
      console.log("Container dimensions:", width, "x", height);
      
      // Only initialize if we have valid dimensions
      if (width > 0 && height > 0) {
        try {
          const handleScoreUpdate = (score) => {
            console.log("Score update:", score);
            updateScore(score);
          };
          
          const handleGameOver = (finalScore) => {
            console.log("Game over with score:", finalScore);
            endGame();
          };
          
          // Initialize game service with explicit dimensions
          gameService.initialize(
            'game-canvas-container',
            handleScoreUpdate,
            handleGameOver
          );
          
          setIsInitialized(true);
          console.log("Game initialized successfully");
          
          // If already playing, start the game
          if (isPlaying) {
            console.log("Auto-starting game");
            gameService.startGame(difficulty);
          }
        } catch (error) {
          console.error("Error initializing game:", error);
        }
      } else {
        console.warn("Container has invalid dimensions, deferring initialization");
      }
    } else {
      console.error("Container element not found!");
    }
    
    // Handle resize to update container dimensions
    const handleResize = () => {
      console.log("Window resized");
      
      // Only update if already initialized
      if (isInitialized) {
        console.log("Resizing existing game instance");
        gameService.resize();
      } else {
        // Try to initialize if not yet done
        const { width, height } = measureContainer();
        console.log("New container dimensions:", width, "x", height);
        
        if (width > 0 && height > 0 && !isInitialized) {
          console.log("Attempting initialization after resize");
          try {
            gameService.initialize(
              'game-canvas-container',
              (score) => updateScore(score),
              () => endGame()
            );
            setIsInitialized(true);
          } catch (error) {
            console.error("Error initializing game after resize:", error);
          }
        }
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    // Setup a mutation observer to detect container size changes
    const observer = new MutationObserver(() => {
      const { width, height } = measureContainer();
      if (width > 0 && height > 0 && width !== containerSize.width && height !== containerSize.height) {
        console.log("Container size changed:", width, "x", height);
        setContainerSize({ width, height });
        
        if (isInitialized) {
          gameService.resize();
        } else if (width > 0 && height > 0) {
          // Try to initialize if we now have valid dimensions
          try {
            gameService.initialize(
              'game-canvas-container',
              (score) => updateScore(score),
              () => endGame()
            );
            setIsInitialized(true);
          } catch (error) {
            console.error("Error initializing game after container change:", error);
          }
        }
      }
    });
    
    if (containerElement) {
      observer.observe(containerElement, { 
        attributes: true, 
        childList: true,
        subtree: true,
        attributeFilter: ['style', 'class']
      });
    }
    
    // Cleanup on unmount
    return () => {
      console.log("GameCanvas unmounting");
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
      gameService.destroy();
      setIsInitialized(false);
    };
  }, [updateScore, endGame, isPlaying, difficulty]);
  
  // Handle game state changes
  useEffect(() => {
    console.log("Game state changed, isPlaying:", isPlaying);
    if (isInitialized) {
      if (isPlaying) {
        console.log("Starting game");
        gameService.startGame(difficulty);
      } else {
        console.log("Stopping game");
        gameService.stopGame();
      }
    }
  }, [isPlaying, difficulty, isInitialized]);
  
  // Update volume when it changes
  useEffect(() => {
    console.log("Volume changed:", volume);
    if (isInitialized) {
      gameService.setVolume(volume);
    }
  }, [volume, isInitialized]);
  
  // Update mute state when it changes
  useEffect(() => {
    console.log("Mute state changed:", isMuted);
    if (isInitialized) {
      gameService.toggleMute();
    }
  }, [isMuted, isInitialized]);
  
  return (
    <div 
      id="game-canvas-container" 
      ref={gameContainerRef} 
      className="game-canvas-container"
      style={{ 
        width: '100%', 
        height: '100%', 
        minHeight: '400px',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {!isInitialized && (
        <div className="game-loading" style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: '#e0e7ff',
          fontSize: '1.2rem',
          textAlign: 'center'
        }}>
          <p>Loading game...</p>
        </div>
      )}
    </div>
  );
};

export default GameCanvas;