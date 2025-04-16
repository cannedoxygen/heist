import React, { useContext, useEffect, useRef } from 'react';
import { GameContext } from '../../context/GameContext';
import GameOver from './GameOver';
import './Game.css';

// This component will integrate with Phaser or p5.js for game rendering
const Game = () => {
  const { 
    isPlaying, 
    score, 
    gameOver, 
    updateScore, 
    endGame,
    difficulty 
  } = useContext(GameContext);
  
  const gameCanvasRef = useRef(null);
  const gameInstanceRef = useRef(null);
  
  // Initialize game when component mounts
  useEffect(() => {
    // This would be replaced with your actual game initialization code
    // Example: Phaser or p5.js setup
    if (gameCanvasRef.current && isPlaying) {
      // Initialize game engine here
      console.log('Game initialized with difficulty:', difficulty);
      
      // Mock game loop for demonstration
      const gameLoopInterval = setInterval(() => {
        // Simulate score increasing over time
        updateScore(1);
      }, 500);
      
      // Mock game over after some time for demonstration
      const gameOverTimeout = setTimeout(() => {
        endGame();
      }, 10000); // 10 seconds
      
      // Store references for cleanup
      gameInstanceRef.current = {
        loopInterval: gameLoopInterval,
        overTimeout: gameOverTimeout
      };
    }
    
    return () => {
      // Cleanup game resources when component unmounts
      if (gameInstanceRef.current) {
        clearInterval(gameInstanceRef.current.loopInterval);
        clearTimeout(gameInstanceRef.current.overTimeout);
      }
    };
  }, [isPlaying, difficulty, updateScore, endGame]);
  
  // Render game over screen if game is over
  if (gameOver) {
    return <GameOver score={score} />;
  }
  
  // Render game canvas
  return (
    <div className="game-container">
      <div className="game-hud">
        <div className="game-score">
          <span className="game-score__label">SCORE</span>
          <span className="game-score__value">{score}</span>
        </div>
        
        <div className="game-difficulty">
          <span className="game-difficulty__label">LEVEL</span>
          <span className="game-difficulty__value">{difficulty.toUpperCase()}</span>
        </div>
      </div>
      
      {isPlaying ? (
        <div className="game-canvas" ref={gameCanvasRef}>
          {/* Game will be rendered here by Phaser or p5.js */}
          <div className="game-placeholder">
            <p>Game Running</p>
            <p>Score: {score}</p>
          </div>
        </div>
      ) : (
        <div className="game-waiting">
          <p>Connect wallet and press START to play</p>
        </div>
      )}
    </div>
  );
};

export default Game;