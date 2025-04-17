import React, { useEffect, useRef, useContext } from 'react';
import { GameContext } from '../../context/GameContext';
import { GameEngine } from '../../game/engine';
import './Game.css';

const Game = () => {
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
    console.log("Game component mounted");
    
    // Initialize game engine
    const handleScoreUpdate = (score) => {
      console.log("Score update:", score);
      updateScore(score);
    };
    
    const handleGameOver = (finalScore) => {
      console.log("Game over with score:", finalScore);
      endGame(finalScore);
    };
    
    // Create game instance
    gameEngineRef.current = new GameEngine(
      'game-container',
      handleScoreUpdate,
      handleGameOver
    );
    
    // Initialize on a short delay to ensure DOM is ready
    setTimeout(() => {
      try {
        gameEngineRef.current.init();
        console.log("Game engine initialized");
      } catch (error) {
        console.error("Error initializing game:", error);
      }
    }, 100);
    
    // Cleanup on unmount
    return () => {
      console.log("Game component unmounting");
      if (gameEngineRef.current) {
        gameEngineRef.current.destroy();
      }
    };
  }, [updateScore, endGame]);
  
  // Handle play state changes
  useEffect(() => {
    console.log("Play state changed:", isPlaying);
    
    if (gameEngineRef.current) {
      if (isPlaying) {
        gameEngineRef.current.start();
      } else {
        gameEngineRef.current.stop();
      }
    }
  }, [isPlaying]);
  
  // Handle volume changes
  useEffect(() => {
    console.log("Volume changed:", volume);
    
    if (gameEngineRef.current) {
      gameEngineRef.current.setVolume(volume);
    }
  }, [volume]);
  
  // Handle mute state changes
  useEffect(() => {
    console.log("Mute state changed:", isMuted);
    
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
  
  return (
    <div className="game-container">
      <div 
        id="game-container" 
        ref={gameContainerRef} 
        className="game-canvas"
      ></div>
    </div>
  );
};

export default Game;