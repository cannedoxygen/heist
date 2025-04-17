import React, { createContext, useState, useCallback, useEffect } from 'react';
import { NETWORK } from '../utils/constants';

// Create wallet context
export const WalletContext = createContext(null);

export const WalletProvider = ({ children }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  const [chainId, setChainId] = useState(null);
  
  // Check for existing connection on mount
  useEffect(() => {
    const checkExistingConnection = async () => {
      try {
        // Check if window.ethereum exists
        if (window.ethereum) {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          
          if (accounts && accounts.length > 0) {
            setWalletAddress(accounts[0]);
            setIsConnected(true);
            
            // Check network
            const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
            const currentChainId = parseInt(chainIdHex, 16);
            setChainId(currentChainId);
            setIsCorrectNetwork(currentChainId === NETWORK.BASE_CHAIN_ID);
          }
        }
      } catch (error) {
        console.error('Error checking existing connection:', error);
      }
    };
    
    checkExistingConnection();
  }, []);
  
  // Listen for account and chain changes
  useEffect(() => {
    if (window.ethereum) {
      // Handle account changes
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          // Disconnected
          setIsConnected(false);
          setWalletAddress('');
        } else {
          // Connected with new account
          setWalletAddress(accounts[0]);
          setIsConnected(true);
        }
      };
      
      // Handle chain changes
      const handleChainChanged = (chainIdHex) => {
        const newChainId = parseInt(chainIdHex, 16);
        setChainId(newChainId);
        setIsCorrectNetwork(newChainId === NETWORK.BASE_CHAIN_ID);
      };
      
      // Subscribe to events
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      
      // Cleanup
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);
  
  // Connect wallet function
  const connectWallet = useCallback(async () => {
    try {
      setIsConnecting(true);
      
      if (!window.ethereum) {
        throw new Error('No wallet provider found. Please install MetaMask or another wallet.');
      }
      
      // Request accounts
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      if (accounts && accounts.length > 0) {
        setWalletAddress(accounts[0]);
        setIsConnected(true);
        
        // Check network
        const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
        const currentChainId = parseInt(chainIdHex, 16);
        setChainId(currentChainId);
        setIsCorrectNetwork(currentChainId === NETWORK.BASE_CHAIN_ID);
        
        // If not on correct network, prompt to switch
        if (currentChainId !== NETWORK.BASE_CHAIN_ID) {
          switchToBaseNetwork();
        }
      }
    } catch (error) {
      console.error('Connection failed:', error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, []);
  
  // Disconnect wallet function
  const disconnectWallet = useCallback(() => {
    setWalletAddress('');
    setIsConnected(false);
  }, []);
  
  // Switch to Base network
  const switchToBaseNetwork = useCallback(async () => {
    try {
      if (!window.ethereum) {
        throw new Error('No wallet provider found.');
      }
      
      // Try to switch to Base network
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${NETWORK.BASE_CHAIN_ID.toString(16)}` }]
        });
      } catch (switchError) {
        // If chain doesn't exist in wallet, add it
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${NETWORK.BASE_CHAIN_ID.toString(16)}`,
              chainName: NETWORK.BASE_NETWORK_NAME,
              rpcUrls: [NETWORK.BASE_RPC_URL],
              blockExplorerUrls: [NETWORK.BASE_EXPLORER_URL],
              nativeCurrency: {
                name: 'ETH',
                symbol: 'ETH',
                decimals: 18
              }
            }]
          });
        } else {
          throw switchError;
        }
      }
      
      setIsCorrectNetwork(true);
    } catch (error) {
      console.error('Network switch failed:', error);
      throw error;
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
    chainId,
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