import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage/HomePage';
import GamePage from './pages/GamePage/GamePage';
import LeaderboardPage from './pages/LeaderboardPage/LeaderboardPage';
import { AppKitProvider } from './config/appkit';
import { GameContextProvider } from './context/GameContext.js';
import { LeaderboardContextProvider } from './context/LeaderboardContext.js';
import './App.css';

const App = () => {
  return (
    <AppKitProvider>
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
    </AppKitProvider>
  );
};

export default App;