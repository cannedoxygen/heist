import React, { createContext, useState, useContext, useCallback } from 'react';
import { WalletContext } from './WalletContext';
import { LeaderboardContext } from './LeaderboardContext';

// Create game context
export const GameContext = createContext(null);

export const GameContextProvider = ({ children }) => {
  const { walletAddress, isConnected, isCorrectNetwork } = useContext(WalletContext);
  const { updateLeaderboard } = useContext(LeaderboardContext);
  
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
  
  // Start game
  const startGame = useCallback(() => {
    if (isConnected && isCorrectNetwork) {
      setIsPlaying(true);
      setGameOver(false);
      setScore(0);
      setPlayerRank(null);
      setIsHighScore(false);
    }
  }, [isConnected, isCorrectNetwork]);
  
  // End game
  const endGame = useCallback(async () => {
    setIsPlaying(false);
    setGameOver(true);
    
    if (walletAddress && score > 0) {
      const result = await updateLeaderboard(walletAddress, score);
      setPlayerRank(result.rank);
      setIsHighScore(result.isHighScore);
    }
  }, [walletAddress, score, updateLeaderboard]);
  
  // Update score
  const updateScore = useCallback((points) => {
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
    restartGame
  };
  
  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};

export default GameContext;