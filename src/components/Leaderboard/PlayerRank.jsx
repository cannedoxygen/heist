import React from 'react';
import './PlayerRank.css';

const PlayerRank = ({ position, walletAddress, score }) => {
  return (
    <div className="player-rank">
      <div className="player-rank__header">
        <h3>Your Position</h3>
      </div>
      
      <div className="player-rank__content">
        <div className="player-rank__position">
          <span className="player-rank__label">RANK</span>
          <span className="player-rank__value">
            {position ? `#${position}` : 'Not Ranked'}
          </span>
        </div>
        
        <div className="player-rank__wallet">
          <span className="player-rank__label">WALLET</span>
          <span className="player-rank__value">{walletAddress}</span>
        </div>
        
        <div className="player-rank__score">
          <span className="player-rank__label">HIGH SCORE</span>
          <span className="player-rank__value">{score.toLocaleString()}</span>
        </div>
      </div>
      
      {position > 10 && (
        <div className="player-rank__motivational">
          {position > 50 ? (
            <p>Keep playing to climb the ranks!</p>
          ) : (
            <p>You're getting closer to the top 10!</p>
          )}
        </div>
      )}
    </div>
  );
};

export default PlayerRank;