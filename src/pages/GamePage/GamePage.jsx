import React, { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { WalletContext } from '../../context/WalletContext';
import { GameContext } from '../../context/GameContext';
import Game from '../../components/Game/Game';
import Button from '../../components/UI/Button/Button';
import './GamePage.css';

const GamePage = () => {
  const { isConnected, isCorrectNetwork } = useContext(WalletContext);
  const { 
    isPlaying, 
    startGame, 
    gameOver,
    isMuted,
    toggleMute,
    volume,
    changeVolume
  } = useContext(GameContext);
  
  const navigate = useNavigate();
  
  // Redirect to home if not connected
  useEffect(() => {
    if (!isConnected || !isCorrectNetwork) {
      navigate('/');
    }
  }, [isConnected, isCorrectNetwork, navigate]);
  
  // Handle key presses for game controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Start game with space bar
      if (e.code === 'Space' && !isPlaying && !gameOver) {
        startGame();
        e.preventDefault();
      }
      
      // Mute toggle with M key
      if (e.key.toLowerCase() === 'm') {
        toggleMute();
        e.preventDefault();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPlaying, gameOver, startGame, toggleMute]);
  
  return (
    <div className="game-page">
      <div className="game-page__header">
        <Button 
          onClick={() => navigate('/')} 
          className="game-page__back-button"
          variant="ghost"
          size="small"
        >
          &lt; Back
        </Button>
        
        <div className="game-page__title">AIKIRA: Data Heist</div>
        
        <div className="game-page__controls">
          <button 
            className={`game-page__mute-button ${isMuted ? 'game-page__mute-button--muted' : ''}`}
            onClick={toggleMute}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
          
          {!isMuted && (
            <div className="game-page__volume-slider">
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
      
      <div className="game-page__content">
        <Game />
        
        {!isPlaying && !gameOver && (
          <div className="game-page__start-overlay">
            <Button 
              onClick={startGame} 
              className="game-page__start-button"
              size="large"
            >
              START GAME
            </Button>
            <p className="game-page__start-hint">Press SPACE to start</p>
          </div>
        )}
      </div>
      
      <div className="game-page__footer">
        <p>Use SPACEBAR to jump/dodge | Press M to mute</p>
      </div>
    </div>
  );
};

export default GamePage;