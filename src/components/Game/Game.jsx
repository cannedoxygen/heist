import React, { useContext, useEffect } from 'react';
import { GameContext } from '../../context/GameContext';
import GameOver from './GameOver';
import GameCanvas from './GameCanvas';
import './Game.css';

// This component will integrate with Phaser for game rendering
const Game = () => {
  const { 
    isPlaying, 
    score, 
    gameOver, 
    difficulty 
  } = useContext(GameContext);
  
  // Debug logging
  useEffect(() => {
    console.log("Game component rendered with state:", {
      isPlaying,
      score,
      gameOver,
      difficulty
    });
  }, [isPlaying, score, gameOver, difficulty]);
  
  // Render game over screen if game is over
  if (gameOver) {
    console.log("Rendering GameOver component");
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
      
      {/* Use GameCanvas component to render the Phaser game */}
      <GameCanvas />
      
      {/* Overlay if not playing yet */}
      {!isPlaying && !gameOver && (
        <div className="game-waiting">
          <p>Connect wallet and press START to play</p>
        </div>
      )}
    </div>
  );
};

export default Game;