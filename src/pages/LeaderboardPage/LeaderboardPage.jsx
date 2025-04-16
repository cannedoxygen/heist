import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { WalletContext } from '../../context/WalletContext';
import Leaderboard from '../../components/Leaderboard/Leaderboard';
import Button from '../../components/UI/Button/Button';
import './LeaderboardPage.css';

const LeaderboardPage = () => {
  const { isConnected } = useContext(WalletContext);
  const navigate = useNavigate();
  
  return (
    <div className="leaderboard-page">
      <div className="leaderboard-page__header">
        <Button 
          onClick={() => navigate('/')} 
          className="leaderboard-page__back-button"
          variant="ghost"
          size="small"
        >
          &lt; Back to Home
        </Button>
        
        <h1 className="leaderboard-page__title">AIKIRA: Data Heist</h1>
        
        {isConnected && (
          <Button 
            onClick={() => navigate('/game')} 
            className="leaderboard-page__play-button"
            variant="primary"
            size="small"
          >
            Play Game
          </Button>
        )}
      </div>
      
      <div className="leaderboard-page__content">
        <Leaderboard />
      </div>
      
      <div className="leaderboard-page__background">
        <div className="grid-lines"></div>
      </div>
    </div>
  );
};

export default LeaderboardPage;