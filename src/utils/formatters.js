// Formatting utilities for display values

// Format wallet address with ellipsis
export const formatWalletAddress = (address, prefixLength = 6, suffixLength = 4) => {
    if (!address) return '';
    if (address.length <= prefixLength + suffixLength) return address;
    
    return `${address.substring(0, prefixLength)}...${address.substring(address.length - suffixLength)}`;
  };
  
  // Format score with commas for thousands
  export const formatScore = (score) => {
    if (score === null || score === undefined) return '0';
    return score.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };
  
  // Format date in standard format
  export const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Format time in HH:MM:SS format
  export const formatTime = (seconds) => {
    if (seconds === null || seconds === undefined) return '00:00';
    
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    const parts = [];
    
    if (hrs > 0) {
      parts.push(hrs.toString().padStart(2, '0'));
    }
    
    parts.push(mins.toString().padStart(2, '0'));
    parts.push(secs.toString().padStart(2, '0'));
    
    return parts.join(':');
  };
  
  // Format relative time (e.g., "2 hours ago")
  export const formatRelativeTime = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    const now = new Date();
    const diffMs = now - date;
    const diffSecs = Math.floor(diffMs / 1000);
    
    if (diffSecs < 60) return 'just now';
    if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)} min ago`;
    if (diffSecs < 86400) return `${Math.floor(diffSecs / 3600)} hr ago`;
    if (diffSecs < 604800) return `${Math.floor(diffSecs / 86400)} days ago`;
    
    return formatDate(dateString);
  };
  
  // Format difficulty level for display
  export const formatDifficulty = (difficulty) => {
    if (!difficulty) return 'NORMAL';
    
    const formatted = difficulty.toUpperCase();
    
    switch (formatted) {
      case 'EASY':
        return 'EASY';
      case 'NORMAL':
        return 'NORMAL';
      case 'HARD':
        return 'HARD';
      default:
        return formatted;
    }
  };
  
  // Format rank with ordinal suffix (1st, 2nd, 3rd, etc.)
  export const formatRank = (rank) => {
    if (!rank) return 'N/A';
    
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const remainder = rank % 100;
    
    return rank + (
      (remainder >= 11 && remainder <= 13) 
        ? 'th'
        : suffixes[remainder % 10] || 'th'
    );
  };
  
  // Format currency values (ETH)
  export const formatEth = (value, decimals = 4) => {
    if (value === null || value === undefined) return '0 ETH';
    
    const number = typeof value === 'string' ? parseFloat(value) : value;
    
    return `${number.toFixed(decimals)} ETH`;
  };
  
  export default {
    formatWalletAddress,
    formatScore,
    formatDate,
    formatTime,
    formatRelativeTime,
    formatDifficulty,
    formatRank,
    formatEth
  };