import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { WalletContext } from '../../context/WalletContext';
import WalletConnection from '../../components/WalletConnection/WalletConnection';
import Button from '../../components/UI/Button/Button';
import './HomePage.css';

const HomePage = () => {
  const { isConnected, isCorrectNetwork } = useContext(WalletContext);
  const navigate = useNavigate();
  
  const startGame = () => {
    navigate('/game');
  };
  
  return (
    <div className="home-page">
      <div className="home-page__content">
        <div className="home-page__header">
          <h1 className="home-page__title">AIKIRA: Data Heist</h1>
          <p className="home-page__subtitle">Collect data. Dodge traps. Survive the grid.</p>
        </div>
        
        <div className="home-page__wallet">
          <WalletConnection />
        </div>
        
        {isConnected && isCorrectNetwork && (
          <div className="home-page__actions">
            <Button 
              onClick={startGame} 
              className="home-page__start-button"
              size="large"
            >
              START GAME
            </Button>
            
            <Button 
              to="/leaderboard" 
              className="home-page__leaderboard-button"
              variant="secondary"
            >
              LEADERBOARD
            </Button>
          </div>
        )}
        
        <div className="home-page__instructions">
          <h2>How to Play</h2>
          <ul>
            <li>Use <span className="key">SPACEBAR</span> or <span className="key">TAP</span> to jump/dodge obstacles</li>
            <li>Collect blue data nodes to increase your score</li>
            <li>Avoid red corrupted nodes and grid traps</li>
            <li>Survive as long as possible for highest score</li>
          </ul>
        </div>
      </div>
      
      <div className="home-page__background">
        <div className="grid-lines"></div>
        <div className="data-points"></div>
      </div>
      
      <footer className="home-page__footer">
        <p>Connect Wallet on Base Network to Play</p>
        <p>© 2025 AIKIRA: Data Heist</p>
      </footer>
    </div>
  );
};

export default HomePage;