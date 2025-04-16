import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useAccount, useDisconnect, useChains, useSwitchChain } from 'wagmi';
import { getAppKit } from '@reown/appkit/react';

// Create wallet context
export const WalletContext = createContext(null);

export const WalletContextProvider = ({ children }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  
  const { address, isConnected } = useAccount();
  const { disconnectAsync } = useDisconnect();
  const { chains } = useChains();
  const { switchChainAsync } = useSwitchChain();
  
  const appKit = getAppKit();
  
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
    // Get current chain from Wagmi
    const chainId = appKit.getChainId();
    if (chainId) {
      setIsCorrectNetwork(chainId === BASE_CHAIN_ID);
    }
  }, [appKit]);
  
  // Connect wallet function
  const connectWallet = useCallback(async () => {
    try {
      setIsConnecting(true);
      await appKit.connect();
    } catch (error) {
      console.error('Connection failed:', error);
    } finally {
      setIsConnecting(false);
    }
  }, [appKit]);
  
  // Disconnect wallet function
  const disconnectWallet = useCallback(async () => {
    try {
      await disconnectAsync();
    } catch (error) {
      console.error('Disconnection failed:', error);
    }
  }, [disconnectAsync]);
  
  // Switch to Base network
  const switchToBaseNetwork = useCallback(async () => {
    try {
      const baseChain = chains.find(chain => chain.id === BASE_CHAIN_ID);
      if (baseChain) {
        await switchChainAsync({ chainId: BASE_CHAIN_ID });
      }
    } catch (error) {
      console.error('Network switch failed:', error);
    }
  }, [chains, switchChainAsync]);
  
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