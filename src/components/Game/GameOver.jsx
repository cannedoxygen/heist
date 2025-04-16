import React, { useContext } from 'react';
import { GameContext } from '../../context/GameContext';
import { WalletContext } from '../../context/WalletContext';
import Button from '../UI/Button/Button';
import './GameOver.css';

const GameOver = ({ score }) => {
  const { 
    playerRank, 
    isHighScore, 
    restartGame 
  } = useContext(GameContext);
  
  const { formatAddress, walletAddress } = useContext(WalletContext);
  
  return (
    <div className="game-over">
      <div className="game-over__container">
        <h2 className="game-over__title">GAME OVER</h2>
        
        <div className="game-over__score">
          <div className="game-over__score-display">
            <span className="game-over__score-label">FINAL SCORE</span>
            <span className="game-over__score-value">{score}</span>
          </div>
          
          {isHighScore && (
            <div className="game-over__new-highscore">NEW HIGHSCORE!</div>
          )}
        </div>
        
        <div className="game-over__details">
          <div className="game-over__wallet">
            <span className="game-over__label">WALLET</span>
            <span className="game-over__value">{formatAddress(walletAddress)}</span>
          </div>
          
          {playerRank && (
            <div className="game-over__rank">
              <span className="game-over__label">RANK</span>
              <span className="game-over__value">#{playerRank}</span>
            </div>
          )}
        </div>
        
        <div className="game-over__actions">
          <Button 
            onClick={restartGame} 
            className="game-over__button game-over__button--restart"
          >
            PLAY AGAIN
          </Button>
          
          <Button 
            to="/leaderboard"
            className="game-over__button game-over__button--leaderboard"
          >
            VIEW LEADERBOARD
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GameOver;