import React, { createContext, useState, useCallback } from 'react';

// Create wallet context
export const WalletContext = createContext(null);

export const WalletProvider = ({ children }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(true);
  
  // Connect wallet function with console logs for debugging
  const connectWallet = useCallback(async () => {
    console.log('Connect wallet called');
    try {
      setIsConnecting(true);
      console.log('Setting isConnecting to true');
      
      // Simulate connection delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Delay complete');
      
      // Generate a demo wallet address
      const demoAddress = '0x' + Math.random().toString(16).substring(2, 14);
      console.log('Generated demo address:', demoAddress);
      
      // Update state
      setWalletAddress(demoAddress);
      setIsConnected(true);
      console.log('State updated: isConnected =', true, 'walletAddress =', demoAddress);
      
    } catch (error) {
      console.error('Connection failed:', error);
    } finally {
      setIsConnecting(false);
      console.log('Setting isConnecting to false');
    }
  }, []);
  
  // Disconnect wallet function
  const disconnectWallet = useCallback(() => {
    console.log('Disconnect wallet called');
    setWalletAddress('');
    setIsConnected(false);
    console.log('Wallet disconnected');
  }, []);
  
  // Switch to Base network
  const switchToBaseNetwork = useCallback(async () => {
    console.log('Switch network called');
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setIsCorrectNetwork(true);
      console.log('Network switched to Base');
    } catch (error) {
      console.error('Network switch failed:', error);
    }
  }, []);
  
  // Format address for display (0x1234...5678)
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };
  
  // Context value
  const value = {
    walletAddress,
    isConnected,
    isConnecting,
    isCorrectNetwork,
    connectWallet,
    disconnectWallet,
    switchToBaseNetwork,
    formatAddress
  };
  
  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

export default WalletContext;