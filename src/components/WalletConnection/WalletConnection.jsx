import React, { useContext, useEffect } from 'react';
import { WalletContext } from '../../context/WalletContext';
import Button from '../UI/Button/Button';
import './WalletConnection.css';

const WalletConnection = () => {
  const { 
    isConnected, 
    walletAddress, 
    isConnecting, 
    connectWallet,
    disconnectWallet, 
    formatAddress,
    isCorrectNetwork,
    switchToBaseNetwork
  } = useContext(WalletContext);

  // Add debug useEffect
  useEffect(() => {
    console.log('WalletConnection component rendered');
    console.log('isConnected:', isConnected);
    console.log('walletAddress:', walletAddress);
    console.log('isConnecting:', isConnecting);
  }, [isConnected, walletAddress, isConnecting]);

  // Debug handler for connect button
  const handleConnectClick = () => {
    console.log('Connect button clicked');
    connectWallet();
  };

  // Render connect wallet UI if not connected
  if (!isConnected) {
    return (
      <div className="wallet-connection">
        <div className="wallet-connection__header">
          <h2>Connect Wallet to Play</h2>
          <p>AIKIRA: Data Heist requires a wallet connection to save your scores.</p>
        </div>
        
        <div className="wallet-connection__options">
          <Button
            onClick={handleConnectClick}
            className="wallet-button"
            disabled={isConnecting}
          >
            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
          </Button>
        </div>
      </div>
    );
  }

  // Render network switch UI if on wrong network
  if (!isCorrectNetwork) {
    return (
      <div className="wallet-connection wallet-connection--network">
        <div className="wallet-connection__header">
          <h2>Switch Network</h2>
          <p>Please switch to Base network to continue.</p>
        </div>
        <Button onClick={switchToBaseNetwork} className="wallet-button wallet-button--network">
          Switch to Base
        </Button>
      </div>
    );
  }

  // Render connected state
  return (
    <div className="wallet-connection wallet-connection--connected">
      <div className="wallet-connection__info">
        <p className="wallet-connection__address">
          {formatAddress(walletAddress)}
        </p>
        <span className="wallet-connection__status">Connected</span>
      </div>
      <Button 
        onClick={disconnectWallet} 
        className="wallet-button wallet-button--disconnect"
        size="small"
      >
        Disconnect
      </Button>
    </div>
  );
};

export default WalletConnection;