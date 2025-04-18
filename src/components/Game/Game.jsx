// src/components/Game/Game.jsx
import React, { useEffect, useRef, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameContext } from '../../context/GameContext';
import { useWallet } from '../../hooks/useWallet';
import { gameService } from '../../services/gameService';
import GameOver from './GameOver';
import './Game.css';

const Game = () => {
  const { 
    updateScore, 
    endGame,
    isPlaying,
    score,
    gameOver,
    difficulty,
    volume,
    isMuted,
    restartGame: contextRestartGame 
  } = useContext(GameContext);
  
  const { isConnected, isCorrectNetwork } = useWallet();
  
  const navigate = useNavigate();
  const gameContainerRef = useRef(null);
  const gameInstanceRef = useRef(null);
  const [containerReady, setContainerReady] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Enhanced restart game function
  const restartGame = () => {
    if (gameContainerRef.current) {
      setTimeout(() => {
        contextRestartGame();
      }, 50);
    } else {
      contextRestartGame();
    }
  };
  
  // Redirect to home if not connected
  useEffect(() => {
    if (!isConnected || !isCorrectNetwork) {
      navigate('/');
    }
  }, [isConnected, isCorrectNetwork, navigate]);
  
  // Initialize game after container is ready
  useEffect(() => {
    console.log("Game component mounted");
    
    // Mark container as ready after a short delay to ensure DOM is fully rendered
    const readyTimer = setTimeout(() => {
      setContainerReady(true);
    }, 100);
    
    return () => {
      clearTimeout(readyTimer);
      console.log("Game component unmounting");
      
      // Clean up game instance
      if (gameInstanceRef.current) {
        gameService.destroy();
        gameInstanceRef.current = null;
      }
      
      setIsInitialized(false);
    };
  }, []);
  
  // Initialize game once container is ready
  useEffect(() => {
    if (!containerReady || isInitialized) return;
    
    // Initialize game engine
    const handleScoreUpdate = (points) => {
      console.log("Score update:", points);
      updateScore(points);
    };
    
    const handleGameOver = (finalScore) => {
      console.log("Game over with score:", finalScore);
      endGame(finalScore);
    };
    
    try {
      // Get container dimensions before initialization
      const container = gameContainerRef.current;
      if (container) {
        console.log("Container dimensions:", container.offsetWidth, "x", container.offsetHeight);
      }
      
      // Initialize game service
      gameInstanceRef.current = gameService.initialize(
        'game-container', 
        handleScoreUpdate, 
        handleGameOver
      );
      
      setIsInitialized(true);
      console.log("Game engine initialized");
    } catch (error) {
      console.error("Error initializing game:", error);
    }
    
  }, [containerReady, updateScore, endGame, isInitialized]);
  
  // Handle play state changes
  useEffect(() => {
    console.log("Play state changed:", isPlaying);
    
    if (isInitialized && gameInstanceRef.current) {
      if (isPlaying) {
        gameService.startGame(difficulty);
      } else {
        gameService.stopGame();
      }
    }
  }, [isPlaying, difficulty, isInitialized]);
  
  // Handle volume changes
  useEffect(() => {
    console.log("Volume changed:", volume);
    
    if (isInitialized && gameInstanceRef.current) {
      gameService.setVolume(volume);
    }
  }, [volume, isInitialized]);
  
  // Handle mute state changes
  useEffect(() => {
    console.log("Mute state changed:", isMuted);
    
    if (isInitialized && gameInstanceRef.current) {
      gameService.toggleMute();
    }
  }, [isMuted, isInitialized]);
  
  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (isInitialized && gameInstanceRef.current) {
        // Update container size in state and resize game
        gameService.resize();
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isInitialized]);
  
  return (
    <div className="game-container">
      {/* Game Canvas - Fix size with absolute dimensions */}
      <div 
        id="game-container" 
        ref={gameContainerRef} 
        className="game-canvas"
        style={{ 
          width: '100%', 
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      ></div>
      
      {/* Game HUD - Position as overlay */}
      <div className="game-hud" style={{ position: 'relative', zIndex: 10 }}>
        <div className="game-score">
          <div className="game-score__label">SCORE</div>
          <div className="game-score__value">{score}</div>
        </div>
        
        <div className="game-difficulty">
          <div className="game-difficulty__label">LEVEL</div>
          <div className="game-difficulty__value">{difficulty.toUpperCase()}</div>
        </div>
      </div>
      
      {/* Game Controls overlay */}
      {!isPlaying && !gameOver && (
        <div className="game-controls__overlay" style={{ position: 'absolute', zIndex: 20 }}>
          <button 
            onClick={() => gameService.startGame(difficulty)} 
            className="game-controls__start-button"
          >
            START GAME
          </button>
          <p className="game-controls__hint">Press SPACE to start</p>
        </div>
      )}
      
      {/* Game Over Overlay */}
      {gameOver && <GameOver score={score} restartGame={restartGame} />}
    </div>
  );
};

export default Game;