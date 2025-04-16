import { supabase } from './supabaseClient';

// API Service for backend interactions
export const apiService = {
  // Base API URL (if needed in addition to Supabase)
  API_URL: process.env.REACT_APP_API_URL || '',
  
  // Generic GET request
  get: async (endpoint, options = {}) => {
    try {
      const response = await fetch(`${apiService.API_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });
      
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error);
      throw error;
    }
  },
  
  // Generic POST request
  post: async (endpoint, data, options = {}) => {
    try {
      const response = await fetch(`${apiService.API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        body: JSON.stringify(data),
        ...options
      });
      
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error posting to ${endpoint}:`, error);
      throw error;
    }
  },
  
  // Health check endpoint
  checkServerStatus: async () => {
    try {
      const response = await fetch(`${apiService.API_URL}/health`);
      return response.ok;
    } catch (error) {
      console.error('Server health check failed:', error);
      return false;
    }
  },
  
  // Verify wallet signature (could be used for additional security)
  verifyWalletSignature: async (address, message, signature) => {
    try {
      const response = await apiService.post('/verify-signature', {
        address,
        message,
        signature
      });
      
      return response.verified;
    } catch (error) {
      console.error('Signature verification failed:', error);
      return false;
    }
  },
  
  // Fetch game settings/config from backend
  fetchGameConfig: async () => {
    try {
      // First try to fetch from Supabase
      const { data, error } = await supabase
        .from('game_config')
        .select('*')
        .single();
      
      if (error) {
        // Fallback to default API
        return await apiService.get('/game-config');
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching game config:', error);
      
      // Return default config as fallback
      return {
        difficulty_levels: ['easy', 'normal', 'hard'],
        default_difficulty: 'normal',
        obstacle_speeds: {
          easy: 300,
          normal: 350,
          hard: 400
        },
        data_value: 10,
        speed_increase_interval: 10000 // ms
      };
    }
  }
};

export default apiService;