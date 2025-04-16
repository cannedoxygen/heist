import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

// Import styles for the component libraries
// If you're using any additional style imports from your original file, include them here
import '@reown/appkit/styles.css'; // Make sure this is imported if needed

// Render the App - the actual wallet setup now happens in appkit.js
const root = createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);