// src/index.js
import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

// Render the App without StrictMode to prevent double rendering
// This fixes the issue with duplicate UI elements and double score counting
const root = createRoot(document.getElementById('root'));
root.render(<App />);