import React, { useContext, useEffect } from 'react';
import { LeaderboardContext } from '../../context/LeaderboardContext';
import { WalletContext } from '../../context/WalletContext';
import LeaderboardEntry from './LeaderboardEntry';
import PlayerRank from './PlayerRank';
import './Leaderboard.css';

const Leaderboard = () => {
  const { 
    leaderboard, 
    isLoading, 
    error, 
    fetchLeaderboard, 
    playerPosition,
    getPlayerPosition
  } = useContext(LeaderboardContext);
  
  const { walletAddress, formatAddress, isConnected } = useContext(WalletContext);
  
  // Fetch leaderboard on mount
  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);
  
  // Get player position when connected
  useEffect(() => {
    if (isConnected && walletAddress) {
      getPlayerPosition(walletAddress);
    }
  }, [isConnected, walletAddress, getPlayerPosition]);
  
  // Loading state
  if (isLoading && leaderboard.length === 0) {
    return (
      <div className="leaderboard leaderboard--loading">
        <h2>Loading Leaderboard...</h2>
        <div className="leaderboard__loading-spinner"></div>
      </div>
    );
  }
  
  // Error state
  if (error && leaderboard.length === 0) {
    return (
      <div className="leaderboard leaderboard--error">
        <h2>Error Loading Leaderboard</h2>
        <p>{error}</p>
        <button onClick={fetchLeaderboard} className="leaderboard__retry-button">
          Retry
        </button>
      </div>
    );
  }
  
  return (
    <div className="leaderboard">
      <div className="leaderboard__header">
        <h2>AIKIRA: Data Heist Leaderboard</h2>
        <p>Top 100 Players</p>
      </div>
      
      {/* Player's own position */}
      {isConnected && playerPosition && (
        <PlayerRank 
          position={playerPosition} 
          walletAddress={formatAddress(walletAddress)} 
          score={leaderboard.find(entry => entry.wallet_address === walletAddress)?.score || 0}
        />
      )}
      
      {/* Leaderboard table */}
      <div className="leaderboard__table">
        <div className="leaderboard__table-header">
          <div className="leaderboard__rank">Rank</div>
          <div className="leaderboard__wallet">Wallet</div>
          <div className="leaderboard__score">Score</div>
          <div className="leaderboard__date">Last Played</div>
        </div>
        
        <div className="leaderboard__table-body">
          {leaderboard.length > 0 ? (
            leaderboard.map((entry, index) => (
              <LeaderboardEntry
                key={entry.id || index}
                rank={index + 1}
                walletAddress={formatAddress(entry.wallet_address)}
                score={entry.score}
                date={entry.last_played}
                isPlayer={entry.wallet_address === walletAddress}
              />
            ))
          ) : (
            <div className="leaderboard__empty">
              <p>No entries yet. Be the first to play!</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="leaderboard__footer">
        <button onClick={fetchLeaderboard} className="leaderboard__refresh-button">
          Refresh Leaderboard
        </button>
      </div>
    </div>
  );
};

export default Leaderboard;