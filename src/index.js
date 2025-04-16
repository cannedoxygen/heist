import React from 'react';
import { createRoot } from 'react-dom/client';
import { WagmiConfig, createConfig } from 'wagmi';
import { configureChains } from '@wagmi/core';
import { base } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { phantomConnector } from '@phantom-labs/wagmi-connector';
import { 
  RainbowKitProvider,
  getDefaultWallets,
  connectorsForWallets
} from '@rainbow-me/rainbowkit';
import { walletConnectWallet } from '@rainbow-me/rainbowkit/wallets';
import '@rainbow-me/rainbowkit/styles.css';
import './index.css';
import App from './App';

// Configure chains for the wallets
const { chains, publicClient } = configureChains(
  [base],
  [publicProvider()]
);

// Get RainbowKit connectors
const { wallets } = getDefaultWallets({
  appName: 'AIKIRA: Data Heist',
  projectId: process.env.REACT_APP_WALLETCONNECT_PROJECT_ID,
  chains
});

// Create Wagmi config with all connectors
const connectors = connectorsForWallets([
  ...wallets,
  {
    groupName: 'Other',
    wallets: [
      walletConnectWallet({ projectId: process.env.REACT_APP_WALLETCONNECT_PROJECT_ID, chains }),
    ],
  },
]);

// Add Phantom connector
connectors.push(phantomConnector({ chains }));

// Create wagmi config
const config = createConfig({
  autoConnect: true,
  connectors,
  publicClient
});

// Render the App
const root = createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <WagmiConfig config={config}>
      <RainbowKitProvider chains={chains}>
        <App />
      </RainbowKitProvider>
    </WagmiConfig>
  </React.StrictMode>
);