// Helper functions

// Format date to readable string
export const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return '';
    }
    
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Format time elapsed since date
  export const timeAgo = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return '';
    }
    
    const seconds = Math.floor((now - date) / 1000);
    
    // Less than a minute
    if (seconds < 60) {
      return 'just now';
    }
    
    // Less than an hour
    if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    }
    
    // Less than a day
    if (seconds < 86400) {
      const hours = Math.floor(seconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }
    
    // Less than a week
    if (seconds < 604800) {
      const days = Math.floor(seconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
    
    // Default to formatted date
    return formatDate(dateString);
  };
  
  // Format score with commas
  export const formatScore = (score) => {
    return score.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };
  
  // Format currency value (ETH)
  export const formatEth = (value, decimals = 4) => {
    if (!value) return '0';
    
    // Convert to number if string
    const num = typeof value === 'string' ? parseFloat(value) : value;
    
    // Format with specified decimals
    return num.toFixed(decimals);
  };
  
  // Local storage helpers
  export const storage = {
    get: (key, defaultValue = null) => {
      try {
        const value = localStorage.getItem(key);
        return value !== null ? JSON.parse(value) : defaultValue;
      } catch (error) {
        console.error(`Error getting item ${key} from localStorage:`, error);
        return defaultValue;
      }
    },
    
    set: (key, value) => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (error) {
        console.error(`Error setting item ${key} in localStorage:`, error);
        return false;
      }
    },
    
    remove: (key) => {
      try {
        localStorage.removeItem(key);
        return true;
      } catch (error) {
        console.error(`Error removing item ${key} from localStorage:`, error);
        return false;
      }
    },
    
    clear: () => {
      try {
        localStorage.clear();
        return true;
      } catch (error) {
        console.error('Error clearing localStorage:', error);
        return false;
      }
    }
  };
  
  // Debounce function for limiting rapid function calls
  export const debounce = (func, wait = 300) => {
    let timeout;
    
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };
  
  // Generate random hash for IDs
  export const generateRandomHash = (length = 8) => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
  };
  
  export default {
    formatDate,
    timeAgo,
    formatScore,
    formatEth,
    storage,
    debounce,
    generateRandomHash
  };