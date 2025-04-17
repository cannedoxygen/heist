import React, { useContext } from 'react';
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

  // Render based on connection state
  const renderConnectionState = () => {
    // Not connected - show connect button
    if (!isConnected) {
      return (
        <div className="wallet-connection">
          <div className="wallet-connection__header">
            <h2>Connect Wallet to Play</h2>
            <p>AIKIRA: Data Heist requires a wallet connection to save your scores.</p>
          </div>
          
          <div className="wallet-connection__options">
            <Button
              onClick={connectWallet}
              className="wallet-button"
              disabled={isConnecting}
            >
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </Button>
          </div>
        </div>
      );
    }

    // Connected but wrong network - show network switch button
    if (!isCorrectNetwork) {
      return (
        <div className="wallet-connection wallet-connection--network">
          <div className="wallet-connection__header">
            <h2>Switch Network</h2>
            <p>Please switch to Base network to continue.</p>
          </div>
          <Button 
            onClick={switchToBaseNetwork} 
            className="wallet-button wallet-button--network"
          >
            Switch to Base
          </Button>
        </div>
      );
    }

    // Connected and correct network - show wallet info
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

  return renderConnectionState();
};

export default WalletConnection;