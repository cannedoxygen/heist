// src/components/Game/GameCanvas.jsx - FIXED
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
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Initialize game engine once on mount
  useEffect(() => {
    // Set up game callbacks with error handling
    const handleScoreUpdate = (points) => {
      try {
        updateScore(points);
      } catch (error) {
        console.error("Error in score callback:", error);
      }
    };
    
    const handleGameOver = (finalScore) => {
      try {
        endGame(finalScore);
      } catch (error) {
        console.error("Error in game over callback:", error);
      }
    };
    
    // Wait a short time to ensure DOM is fully rendered
    const initTimer = setTimeout(() => {
      if (gameContainerRef.current && !isInitialized) {
        try {
          gameService.initialize(
            'game-canvas-container',
            handleScoreUpdate,
            handleGameOver
          );
          setIsInitialized(true);
        } catch (error) {
          console.error("Error initializing game:", error);
        }
      }
    }, 100);
    
    // CRITICAL FIX: Remove window resize listener - it's causing problems
    // Instead, handle resize in the engine itself
    
    // Cleanup function
    return () => {
      clearTimeout(initTimer);
      // REMOVED: window.removeEventListener('resize', handleResize);
      gameService.destroy();
      setIsInitialized(false);
    };
  }, [updateScore, endGame]);
  
  // Handle game state changes
  useEffect(() => {
    if (isInitialized) {
      if (isPlaying) {
        gameService.startGame(difficulty);
      } else {
        gameService.stopGame();
      }
    }
  }, [isPlaying, difficulty, isInitialized]);
  
  // Update volume when it changes
  useEffect(() => {
    if (isInitialized) {
      gameService.setVolume(volume);
    }
  }, [volume, isInitialized]);
  
  // Update mute state when it changes
  useEffect(() => {
    if (isInitialized) {
      gameService.toggleMute();
    }
  }, [isMuted, isInitialized]);
  
  return (
    <div 
      id="game-canvas-container" 
      ref={gameContainerRef} 
      className="game-canvas-container"
      aria-label="Game area"
    >
      {!isInitialized && (
        <div className="game-loading">
          Loading game...
        </div>
      )}
    </div>
  );
};

export default GameCanvas;