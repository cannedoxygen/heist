// Environment configuration helper
// This file provides environment variables with fallbacks

// Get environment variables from process.env
const getEnv = () => {
    // Environment type
    const NODE_ENV = process.env.NODE_ENV || 'development';
    
    // Determine if in production
    const isProduction = NODE_ENV === 'production';
    
    // API URL: Use development API in dev mode, production API in prod
    const API_URL = isProduction
      ? process.env.REACT_APP_API_URL
      : process.env.REACT_APP_DEV_API_URL || 'http://localhost:3001';
    
    // WalletConnect Project ID
    const WALLETCONNECT_PROJECT_ID = process.env.REACT_APP_WALLETCONNECT_PROJECT_ID || '';
    
    // Supabase configuration
    const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || '';
    const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || '';
    
    // Base Network RPC URL
    const BASE_RPC_URL = process.env.REACT_APP_BASE_RPC_URL || 'https://mainnet.base.org';
    
    // Optional: Analytics
    const ANALYTICS_ID = process.env.REACT_APP_ANALYTICS_ID || '';
    
    // Optional: Error reporting
    const ERROR_REPORTING_DSN = process.env.REACT_APP_ERROR_REPORTING_DSN || '';
    
    // Return all environment variables
    return {
      NODE_ENV,
      isProduction,
      API_URL,
      WALLETCONNECT_PROJECT_ID,
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      BASE_RPC_URL,
      ANALYTICS_ID,
      ERROR_REPORTING_DSN
    };
  };
  
  // Validate required environment variables
  export const validateEnv = () => {
    const env = getEnv();
    const requiredVars = [
      'WALLETCONNECT_PROJECT_ID',
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY'
    ];
    
    const missingVars = requiredVars.filter(varName => !env[varName]);
    
    if (missingVars.length > 0) {
      console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
      console.error('Please check your .env file or environment configuration.');
      
      // Only throw error in production to allow development without all vars
      if (env.isProduction) {
        throw new Error('Missing required environment variables');
      }
    }
    
    return env;
  };
  
  // Export environment variables
  export const env = getEnv();
  
  export default env;