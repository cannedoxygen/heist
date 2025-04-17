import { supabase } from '../context/supabaseClient';

// Leaderboard service for handling leaderboard operations
export const leaderboardService = {
  // Cache to reduce database calls
  _cache: {
    leaderboard: null,
    lastFetch: 0,
    cacheDuration: 60000, // 1 minute cache validity
  },
  
  // Clear cache (useful after updates)
  clearCache() {
    this._cache.leaderboard = null;
    this._cache.lastFetch = 0;
  },
  
  // Fetch top leaderboard entries (limited to max count)
  fetchLeaderboard: async (limit = 100, forceFresh = false) => {
    try {
      // Check if we have valid cached data
      const now = Date.now();
      if (
        !forceFresh && 
        leaderboardService._cache.leaderboard && 
        now - leaderboardService._cache.lastFetch < leaderboardService._cache.cacheDuration
      ) {
        return leaderboardService._cache.leaderboard;
      }
      
      // Fetch from database
      const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .order('score', { ascending: false })
        .limit(limit);
      
      if (error) {
        throw new Error(`Error fetching leaderboard: ${error.message}`);
      }
      
      // Update cache
      leaderboardService._cache.leaderboard = data || [];
      leaderboardService._cache.lastFetch = now;
      
      return data || [];
    } catch (error) {
      console.error('Error in fetchLeaderboard:', error);
      // Return empty array instead of throwing, to allow UI to handle gracefully
      return [];
    }
  },
  
  // Get player's high score
  getPlayerScore: async (walletAddress) => {
    if (!walletAddress) {
      return 0;
    }
    
    try {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('score')
        .eq('wallet_address', walletAddress)
        .single();
      
      if (error) {
        // Specific handling for "no rows returned" which is not a true error
        if (error.code === 'PGRST116') {
          return 0;
        }
        throw new Error(`Error getting player score: ${error.message}`);
      }
      
      return data?.score || 0;
    } catch (error) {
      console.error('Error in getPlayerScore:', error);
      return 0;
    }
  },
  
  // Get player's rank on the leaderboard
  getPlayerRank: async (walletAddress) => {
    if (!walletAddress) {
      return null;
    }
    
    try {
      // Get scores in descending order
      const { data, error } = await supabase
        .from('leaderboard')
        .select('wallet_address, score')
        .order('score', { ascending: false });
      
      if (error) {
        throw new Error(`Error getting player rank data: ${error.message}`);
      }
      
      if (!data || data.length === 0) {
        return null;
      }
      
      // Find player's position (case-insensitive comparison)
      const playerIndex = data.findIndex(entry => 
        entry.wallet_address.toLowerCase() === walletAddress.toLowerCase()
      );
      
      // Return 1-based rank (index + 1) or null if not found
      return playerIndex !== -1 ? playerIndex + 1 : null;
    } catch (error) {
      console.error('Error in getPlayerRank:', error);
      return null;
    }
  },
  
  // Update player's score if it's higher than their current score
  updateScore: async (walletAddress, score) => {
    if (!walletAddress || typeof score !== 'number' || isNaN(score)) {
      return { 
        success: false, 
        error: 'Invalid wallet address or score'
      };
    }
    
    try {
      // Get current score first
      const currentScore = await leaderboardService.getPlayerScore(walletAddress);
      
      // Only update if new score is higher
      if (score > currentScore) {
        const { error } = await supabase
          .from('leaderboard')
          .upsert({
            wallet_address: walletAddress,
            score: score,
            last_played: new Date().toISOString()
          }, { 
            onConflict: 'wallet_address' 
          });
        
        if (error) {
          throw new Error(`Error updating score: ${error.message}`);
        }
        
        // Clear the cache since data changed
        leaderboardService.clearCache();
        
        // Get updated rank
        const rank = await leaderboardService.getPlayerRank(walletAddress);
        
        return {
          success: true,
          isHighScore: true,
          previousScore: currentScore,
          newScore: score,
          rank
        };
      }
      
      // If score is not higher, return current rank without updating
      const rank = await leaderboardService.getPlayerRank(walletAddress);
      
      return {
        success: true,
        isHighScore: false,
        previousScore: currentScore,
        newScore: currentScore,
        rank
      };
    } catch (error) {
      console.error('Error in updateScore:', error);
      return { 
        success: false, 
        error: error.message || 'Unknown error updating score'
      };
    }
  }
};

export default leaderboardService;