import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useConnect, useAccount, useDisconnect, useNetwork, useSwitchNetwork } from 'wagmi';

// Create wallet context
export const WalletContext = createContext(null);

export const WalletContextProvider = ({ children }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  
  const { connect, connectors, isLoading, pendingConnector } = useConnect();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { chain } = useNetwork();
  const { switchNetwork } = useSwitchNetwork();
  
  // Base network chain ID
  const BASE_CHAIN_ID = 8453;
  
  // Update wallet address when connected
  useEffect(() => {
    if (isConnected && address) {
      setWalletAddress(address);
    } else {
      setWalletAddress('');
    }
  }, [isConnected, address]);
  
  // Check if on Base network
  useEffect(() => {
    if (chain) {
      setIsCorrectNetwork(chain.id === BASE_CHAIN_ID);
    }
  }, [chain]);
  
  // Connect wallet function
  const connectWallet = useCallback(async (connector) => {
    try {
      setIsConnecting(true);
      await connect({ connector });
    } catch (error) {
      console.error('Connection failed:', error);
    } finally {
      setIsConnecting(false);
    }
  }, [connect]);
  
  // Disconnect wallet function
  const disconnectWallet = useCallback(() => {
    disconnect();
  }, [disconnect]);
  
  // Switch to Base network
  const switchToBaseNetwork = useCallback(() => {
    if (switchNetwork) {
      switchNetwork(BASE_CHAIN_ID);
    }
  }, [switchNetwork]);
  
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
    formatAddress,
    connectors
  };
  
  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

export default WalletContext;