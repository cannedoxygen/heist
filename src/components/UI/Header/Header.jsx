import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { WalletContext } from '../../../context/WalletContext';
import Button from '../Button/Button';
import './Header.css';

const Header = () => {
  const { 
    isConnected, 
    walletAddress, 
    formatAddress, 
    disconnectWallet 
  } = useContext(WalletContext);
  
  const location = useLocation();
  
  return (
    <header className="header">
      <div className="header__logo">
        <Link to="/" className="header__logo-link">
          AIKIRA: Data Heist
        </Link>
      </div>
      
      <nav className="header__nav">
        <ul className="header__nav-list">
          <li className="header__nav-item">
            <Link 
              to="/" 
              className={`header__nav-link ${location.pathname === '/' ? 'header__nav-link--active' : ''}`}
            >
              Home
            </Link>
          </li>
          
          <li className="header__nav-item">
            <Link 
              to="/game" 
              className={`header__nav-link ${location.pathname === '/game' ? 'header__nav-link--active' : ''}`}
            >
              Play
            </Link>
          </li>
          
          <li className="header__nav-item">
            <Link 
              to="/leaderboard" 
              className={`header__nav-link ${location.pathname === '/leaderboard' ? 'header__nav-link--active' : ''}`}
            >
              Leaderboard
            </Link>
          </li>
        </ul>
      </nav>
      
      <div className="header__wallet">
        {isConnected ? (
          <div className="header__wallet-connected">
            <span className="header__wallet-address">
              {formatAddress(walletAddress)}
            </span>
            
            <Button 
              onClick={disconnectWallet} 
              className="header__disconnect-button"
              size="small"
              variant="ghost"
            >
              Disconnect
            </Button>
          </div>
        ) : (
          <Link to="/">
            <Button 
              className="header__connect-button"
              size="small"
              variant="primary"
            >
              Connect Wallet
            </Button>
          </Link>
        )}
      </div>
    </header>
  );
};

export default Header;