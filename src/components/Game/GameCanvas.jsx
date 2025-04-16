import React, { useEffect, useRef, useContext } from 'react';
import { GameContext } from '../../context/GameContext';
import { GameEngine } from '../../game/engine';
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
  const gameEngineRef = useRef(null);
  
  // Initialize game engine
  useEffect(() => {
    if (!gameEngineRef.current) {
      // Create new game engine instance
      gameEngineRef.current = new GameEngine(
        'game-canvas-container',
        handleScoreUpdate,
        handleGameOver
      );
    }
    
    // Cleanup on unmount
    return () => {
      if (gameEngineRef.current) {
        gameEngineRef.current.destroy();
      }
    };
  }, []);
  
  // Start game when isPlaying changes
  useEffect(() => {
    if (isPlaying && gameEngineRef.current) {
      gameEngineRef.current.start();
    } else if (!isPlaying && gameEngineRef.current) {
      gameEngineRef.current.stop();
    }
  }, [isPlaying]);
  
  // Update volume and mute state
  useEffect(() => {
    if (gameEngineRef.current) {
      gameEngineRef.current.setVolume(volume);
    }
  }, [volume]);
  
  useEffect(() => {
    if (gameEngineRef.current) {
      gameEngineRef.current.toggleMute();
    }
  }, [isMuted]);
  
  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (gameEngineRef.current) {
        gameEngineRef.current.resize();
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Score update callback
  const handleScoreUpdate = (score) => {
    updateScore(score);
  };
  
  // Game over callback
  const handleGameOver = (finalScore) => {
    endGame();
  };
  
  return (
    <div 
      id="game-canvas-container" 
      ref={gameContainerRef} 
      className="game-canvas-container"
    />
  );
};

export default GameCanvas;