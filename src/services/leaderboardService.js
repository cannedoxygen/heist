import { supabase } from './supabaseClient';

// Leaderboard service for handling leaderboard operations
export const leaderboardService = {
  // Fetch top leaderboard entries (limited to max count)
  fetchLeaderboard: async (limit = 100) => {
    try {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .order('score', { ascending: false })
        .limit(limit);
      
      if (error) {
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      throw error;
    }
  },
  
  // Get player's high score
  getPlayerScore: async (walletAddress) => {
    try {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('score')
        .eq('wallet_address', walletAddress)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
        throw error;
      }
      
      return data ? data.score : 0;
    } catch (error) {
      console.error('Error getting player score:', error);
      return 0;
    }
  },
  
  // Get player's rank on the leaderboard
  getPlayerRank: async (walletAddress) => {
    try {
      // First get all scores in descending order
      const { data, error } = await supabase
        .from('leaderboard')
        .select('wallet_address, score')
        .order('score', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      // Find player's position in the array (1-based index for rank)
      const playerIndex = data.findIndex(entry => 
        entry.wallet_address.toLowerCase() === walletAddress.toLowerCase()
      );
      
      return playerIndex !== -1 ? playerIndex + 1 : null;
    } catch (error) {
      console.error('Error getting player rank:', error);
      return null;
    }
  },
  
  // Update player's score if it's higher than their current score
  updateScore: async (walletAddress, score) => {
    try {
      // First check if player already has a score
      const currentScore = await leaderboardService.getPlayerScore(walletAddress);
      
      // Only update if new score is higher
      if (score > currentScore) {
        const { data, error } = await supabase
          .from('leaderboard')
          .upsert({
            wallet_address: walletAddress,
            score: score,
            last_played: new Date().toISOString()
          }, { 
            onConflict: 'wallet_address' 
          });
        
        if (error) {
          throw error;
        }
        
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
      console.error('Error updating score:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }
};

export default leaderboardService;