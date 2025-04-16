import { useContext } from 'react';
import { LeaderboardContext } from '../context/LeaderboardContext';

// Custom hook for accessing leaderboard functionality
export const useLeaderboard = () => {
  const context = useContext(LeaderboardContext);
  
  if (!context) {
    throw new Error('useLeaderboard must be used within a LeaderboardContextProvider');
  }
  
  return context;
};

export default useLeaderboard;