import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Register service worker for PWA offline support
// Note: Service worker is only generated during production build
// In dev mode, this will silently fail which is expected
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(
      (registration) => {
        console.log('SW registered:', registration.scope);
      },
      (err) => {
        // Silent failure in dev mode - SW only works in production
        console.log('SW registration skipped (dev mode or not yet built)');
      }
    );
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);