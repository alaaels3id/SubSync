import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Listen to main process test messages if in electron
window.addEventListener('message', (event) => {
  console.log('Received message from main process:', event.data);
});
