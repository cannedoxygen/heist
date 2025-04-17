// src/components/Game/GameControls.jsx
import React, { useContext, useEffect } from 'react';
import { GameContext } from '../../context/GameContext';
import Button from '../UI/Button/Button';
import './GameControls.css';

const GameControls = () => {
  const { 
    isPlaying, 
    startGame, 
    difficulty, 
    changeDifficulty,
    volume, 
    isMuted, 
    toggleMute, 
    changeVolume 
  } = useContext(GameContext);
  
  // Handle key presses - IMPORTANT FIX: Moved to useEffect for proper event handling
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Jump with space bar (handled in game engine)
      
      // Mute toggle with M key
      if (e.key.toLowerCase() === 'm') {
        toggleMute();
      }
      
      // Change difficulty with 1, 2, 3 keys
      if (e.key === '1') {
        changeDifficulty('easy');
      } else if (e.key === '2') {
        changeDifficulty('normal');
      } else if (e.key === '3') {
        changeDifficulty('hard');
      }
    };
    
    // Add the event listener on component mount
    window.addEventListener('keydown', handleKeyDown);
    
    // IMPORTANT: Clean up the event listener when component unmounts
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [toggleMute, changeDifficulty]); // Only re-add listeners if these callbacks change
  
  return (
    <div className="game-controls">
      {/* Main controls */}
      <div className="game-controls__main">
        {!isPlaying && (
          <Button 
            onClick={() => startGame()} 
            className="game-controls__start-button"
            size="large"
          >
            START GAME
          </Button>
        )}
      </div>
      
      {/* Game settings */}
      <div className="game-controls__settings">
        {/* Difficulty selector */}
        <div className="game-controls__difficulty">
          <span className="game-controls__label">Difficulty:</span>
          <div className="game-controls__difficulty-buttons">
            <button 
              className={`game-controls__difficulty-button ${difficulty === 'easy' ? 'game-controls__difficulty-button--active' : ''}`}
              onClick={() => changeDifficulty('easy')}
            >
              Easy
            </button>
            <button 
              className={`game-controls__difficulty-button ${difficulty === 'normal' ? 'game-controls__difficulty-button--active' : ''}`}
              onClick={() => changeDifficulty('normal')}
            >
              Normal
            </button>
            <button 
              className={`game-controls__difficulty-button ${difficulty === 'hard' ? 'game-controls__difficulty-button--active' : ''}`}
              onClick={() => changeDifficulty('hard')}
            >
              Hard
            </button>
          </div>
        </div>
        
        {/* Volume controls */}
        <div className="game-controls__volume">
          <button 
            className={`game-controls__mute-button ${isMuted ? 'game-controls__mute-button--muted' : ''}`}
            onClick={toggleMute}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
          
          {!isMuted && (
            <div className="game-controls__volume-slider">
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.1" 
                value={volume} 
                onChange={(e) => changeVolume(parseFloat(e.target.value))}
              />
            </div>
          )}
        </div>
      </div>
      
      {/* Game instructions */}
      <div className="game-controls__instructions">
        <span className="game-controls__key">SPACE</span> or <span className="game-controls__key">TAP</span> to jump/dodge
        <span className="game-controls__key">M</span> to mute sound
      </div>
    </div>
  );
};

export default GameControls;