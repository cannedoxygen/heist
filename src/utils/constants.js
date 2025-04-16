// Application constants

// Network constants
export const NETWORK = {
    BASE_CHAIN_ID: 8453,
    BASE_NETWORK_NAME: 'Base',
    BASE_EXPLORER_URL: 'https://basescan.org'
  };
  
  // Game constants
  export const GAME = {
    DIFFICULTY: {
      EASY: 'easy',
      NORMAL: 'normal',
      HARD: 'hard'
    },
    
    DIFFICULTY_SETTINGS: {
      easy: {
        speed: 300,
        obstacleInterval: 2000,
        dataInterval: 1000,
        jumpForce: -450
      },
      normal: {
        speed: 350,
        obstacleInterval: 1500,
        dataInterval: 800,
        jumpForce: -500
      },
      hard: {
        speed: 400,
        obstacleInterval: 1200,
        dataInterval: 600,
        jumpForce: -550
      }
    },
    
    PLAYER: {
      DEFAULT_JUMP_FORCE: -500,
      GRAVITY: 1000,
      SIZE: 30
    },
    
    COLLECTIBLE: {
      POINT_VALUE: 10,
      SIZE: 24
    },
    
    OBSTACLE: {
      MIN_WIDTH: 30,
      MAX_WIDTH: 80,
      MIN_HEIGHT: 20,
      MAX_HEIGHT: 40
    },
    
    SPEED_INCREASE: {
      INTERVAL: 10000, // ms
      AMOUNT: 10
    }
  };
  
  // UI constants
  export const UI = {
    ANIMATION_DURATIONS: {
      FADE: 300,
      SLIDE: 300,
      PULSE: 2000,
      GLITCH: 500
    },
    
    BREAKPOINTS: {
      MOBILE: 480,
      TABLET: 768,
      DESKTOP: 1024,
      LARGE: 1440
    },
    
    Z_INDEX: {
      BACKGROUND: 0,
      GAME: 1,
      UI: 10,
      MODAL: 100,
      TOOLTIP: 1000
    }
  };
  
  // Storage keys
  export const STORAGE_KEYS = {
    VOLUME: 'aikira_volume',
    MUTED: 'aikira_muted',
    DIFFICULTY: 'aikira_difficulty',
    LAST_WALLET: 'aikira_last_wallet'
  };
  
  // API endpoints
  export const API = {
    LEADERBOARD: '/leaderboard',
    GAME_CONFIG: '/game-config',
    HEALTH: '/health',
    VERIFY_SIGNATURE: '/verify-signature'
  };
  
  export default {
    NETWORK,
    GAME,
    UI,
    STORAGE_KEYS,
    API
  };