import { useContext } from 'react';
import { WalletContext } from '../context/WalletContext';

// Custom hook for accessing wallet functionality
export const useWallet = () => {
  const context = useContext(WalletContext);
  
  if (!context) {
    throw new Error('useWallet must be used within a WalletContextProvider');
  }
  
  return context;
};

export default useWallet;