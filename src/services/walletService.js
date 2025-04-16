// Wallet utilities for Base network wallet interactions
export const walletService = {
    // Base chain ID
    BASE_CHAIN_ID: 8453,
    
    // Format wallet address for display (0x1234...5678)
    formatAddress: (address, prefixLength = 6, suffixLength = 4) => {
      if (!address) return '';
      if (address.length <= prefixLength + suffixLength) return address;
      
      return `${address.substring(0, prefixLength)}...${address.substring(address.length - suffixLength)}`;
    },
    
    // Check if chain is Base network
    isBaseNetwork: (chainId) => {
      return chainId === walletService.BASE_CHAIN_ID;
    },
    
    // Get Base network config for wallet providers
    getBaseNetworkConfig: () => {
      return {
        id: walletService.BASE_CHAIN_ID,
        name: 'Base',
        network: 'base',
        nativeCurrency: {
          name: 'Ethereum',
          symbol: 'ETH',
          decimals: 18
        },
        rpcUrls: {
          default: {
            http: [process.env.REACT_APP_BASE_RPC_URL || 'https://mainnet.base.org']
          },
          public: {
            http: [process.env.REACT_APP_BASE_RPC_URL || 'https://mainnet.base.org']
          }
        },
        blockExplorers: {
          default: {
            name: 'BaseExplorer',
            url: 'https://basescan.org'
          }
        }
      };
    },
    
    // Check if wallet is connected
    isWalletConnected: (account) => {
      return account && account.isConnected && account.address;
    },
    
    // Validate wallet transaction signature
    validateSignature: async (address, message, signature) => {
      try {
        // This would use ethers.js or viem to verify a signature
        // For example with ethers.js:
        // const signer = ethers.utils.verifyMessage(message, signature);
        // return signer.toLowerCase() === address.toLowerCase();
        
        // Placeholder for implementation:
        console.log("Signature validation would happen here");
        return true;
      } catch (error) {
        console.error('Error validating signature:', error);
        return false;
      }
    }
  };
  
  export default walletService;