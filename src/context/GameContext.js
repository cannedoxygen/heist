// src/context/GameContext.js
import React, { createContext, useState, useContext, useCallback } from 'react';
import { WalletContext } from './WalletContext';

// Create game context
export const GameContext = createContext(null);

export const GameContextProvider = ({ children }) => {
  const { walletAddress, isConnected, isCorrectNetwork } = useContext(WalletContext);
  
  // Game state
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [playerRank, setPlayerRank] = useState(null);
  const [isHighScore, setIsHighScore] = useState(false);
  
  // Game settings
  const [difficulty, setDifficulty] = useState('normal');
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);

  // Implementation without circular dependency
  const updateLeaderboardScore = async (walletAddress, score) => {
    try {
      // This function will be implemented to call your leaderboard service
      console.log('Updating leaderboard for:', walletAddress, 'with score:', score);
      
      // For now, return placeholder values
      const rank = 1; // This would come from your leaderboard service
      const isHighScore = true; // This would be determined based on previous scores
      
      return { rank, isHighScore };
    } catch (error) {
      console.error('Error updating leaderboard:', error);
      return { rank: null, isHighScore: false };
    }
  };
  
  // Start game
  const startGame = useCallback(() => {
    if (isConnected && isCorrectNetwork) {
      setIsPlaying(true);
      setGameOver(false);
      setScore(0); // Reset score when starting game
      setPlayerRank(null);
      setIsHighScore(false);
    }
  }, [isConnected, isCorrectNetwork]);
  
  // End game
  const endGame = useCallback(async (finalScore) => {
    setIsPlaying(false);
    setGameOver(true);
    
    // If we have a final score, use it, otherwise use current context score
    const scoreToSubmit = finalScore !== undefined ? finalScore : score;
    
    if (walletAddress && scoreToSubmit > 0) {
      try {
        const result = await updateLeaderboardScore(walletAddress, scoreToSubmit);
        setPlayerRank(result.rank);
        setIsHighScore(result.isHighScore);
      } catch (error) {
        console.error('Error updating score:', error);
      }
    }
  }, [walletAddress, score]);
  
  // Update score - FIXED to prevent counting twice
  const updateScore = useCallback((points) => {
    console.log("Updating score by", points, "points");
    // Simple increment by the exact points received, no magic multiplier
    setScore(prevScore => prevScore + points);
  }, []);
  
  // Toggle mute
  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);
  
  // Change volume
  const changeVolume = useCallback((newVolume) => {
    setVolume(newVolume);
    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  }, [isMuted]);
  
  // Change difficulty
  const changeDifficulty = useCallback((newDifficulty) => {
    setDifficulty(newDifficulty);
  }, []);
  
  // Restart game
  const restartGame = useCallback(() => {
    startGame();
  }, [startGame]);
  
  // Context value
  const value = {
    isPlaying,
    score,
    gameOver,
    playerRank,
    isHighScore,
    difficulty,
    volume,
    isMuted,
    startGame,
    endGame,
    updateScore,
    toggleMute,
    changeVolume,
    changeDifficulty,
    restartGame,
    updateLeaderboardScore
  };
  
  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};

export default GameContext;