import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage/HomePage';
import GamePage from './pages/GamePage/GamePage';
import LeaderboardPage from './pages/LeaderboardPage/LeaderboardPage';
import { WalletProvider } from './context/WalletContext';
import { GameContextProvider } from './context/GameContext';
import { LeaderboardContextProvider } from './context/LeaderboardContext';
import './App.css';

const App = () => {
  return (
    <WalletProvider>
      <Router>
        <GameContextProvider>
          <LeaderboardContextProvider>
            <div className="app">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/game" element={<GamePage />} />
                <Route path="/leaderboard" element={<LeaderboardPage />} />
              </Routes>
            </div>
          </LeaderboardContextProvider>
        </GameContextProvider>
      </Router>
    </WalletProvider>
  );
};

export default App;