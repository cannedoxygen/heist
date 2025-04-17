import React, { createContext, useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';

// Create leaderboard context
export const LeaderboardContext = createContext(null);

export const LeaderboardContextProvider = ({ children }) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [playerPosition, setPlayerPosition] = useState(null);
  
  // Fetch leaderboard data
  const fetchLeaderboard = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch leaderboard from Supabase
      const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .order('score', { ascending: false })
        .limit(100);
      
      if (error) {
        throw error;
      }
      
      setLeaderboard(data || []);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError('Failed to load leaderboard data');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Update leaderboard with new score
  const updateLeaderboard = useCallback(async (walletAddress, score) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Check if wallet already has a score
      const { data: existingEntry } = await supabase
        .from('leaderboard')
        .select('*')
        .eq('wallet_address', walletAddress)
        .single();
      
      const isHighScore = !existingEntry || existingEntry.score < score;
      
      // Only update if score is higher than existing score
      if (isHighScore) {
        if (existingEntry) {
          // Update existing entry
          await supabase
            .from('leaderboard')
            .update({
              score,
              last_played: new Date().toISOString()
            })
            .eq('wallet_address', walletAddress);
        } else {
          // Create new entry
          await supabase
            .from('leaderboard')
            .insert([
              {
                wallet_address: walletAddress,
                score,
                last_played: new Date().toISOString()
              }
            ]);
        }
      }
      
      // Refresh leaderboard
      await fetchLeaderboard();
      
      // Get player position
      const { data: updatedBoard } = await supabase
        .from('leaderboard')
        .select('*')
        .order('score', { ascending: false });
      
      const playerIndex = updatedBoard.findIndex(entry => entry.wallet_address === walletAddress);
      const rank = playerIndex !== -1 ? playerIndex + 1 : null;
      
      setPlayerPosition(rank);
      
      return {
        rank,
        isHighScore
      };
    } catch (err) {
      console.error('Error updating leaderboard:', err);
      setError('Failed to update leaderboard');
      return { rank: null, isHighScore: false };
    } finally {
      setIsLoading(false);
    }
  }, [fetchLeaderboard]);
  
  // Get player position
  const getPlayerPosition = useCallback(async (walletAddress) => {
    try {
      const { data } = await supabase
        .from('leaderboard')
        .select('*')
        .order('score', { ascending: false });
      
      const playerIndex = data.findIndex(entry => entry.wallet_address === walletAddress);
      const position = playerIndex !== -1 ? playerIndex + 1 : null;
      
      setPlayerPosition(position);
      return position;
    } catch (err) {
      console.error('Error getting player position:', err);
      return null;
    }
  }, []);
  
  // Load leaderboard on mount
  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);
  
  // Context value
  const value = {
    leaderboard,
    isLoading,
    error,
    playerPosition,
    fetchLeaderboard,
    updateLeaderboard,
    getPlayerPosition
  };
  
  return (
    <LeaderboardContext.Provider value={value}>
      {children}
    </LeaderboardContext.Provider>
  );
};

export default LeaderboardContext;