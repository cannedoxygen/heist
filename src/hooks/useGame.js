import { useContext } from 'react';
import { GameContext } from '../context/GameContext';

// Custom hook for accessing game functionality
export const useGame = () => {
  const context = useContext(GameContext);
  
  if (!context) {
    throw new Error('useGame must be used within a GameContextProvider');
  }
  
  return context;
};

export default useGame;