import React from 'react';
import './LeaderboardEntry.css';

const LeaderboardEntry = ({ rank, walletAddress, score, date, isPlayer }) => {
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  return (
    <div className={`leaderboard-entry ${isPlayer ? 'leaderboard-entry--player' : ''}`}>
      <div className="leaderboard-entry__rank">
        {rank <= 3 ? (
          <div className={`leaderboard-entry__trophy leaderboard-entry__trophy--${rank}`}>
            {rank === 1 && '🥇'}
            {rank === 2 && '🥈'}
            {rank === 3 && '🥉'}
          </div>
        ) : (
          <span>{rank}</span>
        )}
      </div>
      
      <div className="leaderboard-entry__wallet">
        {walletAddress}
        {isPlayer && <span className="leaderboard-entry__you-badge">YOU</span>}
      </div>
      
      <div className="leaderboard-entry__score">
        {score.toLocaleString()}
      </div>
      
      <div className="leaderboard-entry__date">
        {formatDate(date)}
      </div>
    </div>
  );
};

export default LeaderboardEntry;