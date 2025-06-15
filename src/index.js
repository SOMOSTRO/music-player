import React from 'react';
import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';


if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js')
      .then((registration) => {
        console.log('Service Worker registered:', registration);

        // Check if the service worker is active
        if (registration.active) {
          console.log('Service Worker is active');
        }

        // Listen for the service worker to become active
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'activated') {
              console.log('Service Worker activated');
            }
          });
        });
      })
      .catch((error) => {
        console.error('Service Worker registration failed:', error);
      });
  });
}

// Grant Persistent storage permission 
if (navigator.storage && navigator.storage.persist) {
  navigator.storage.persist().then(granted => {
    if (granted) {
      console.log("Persistent storage granted");
    } else {
      console.warn("Persistent storage not granted");
    }
  });
} else {
  console.warn("Failed to access browser storage, persistent storage unavailable.")
}


const root = ReactDOM.createRoot(document.getElementById('root')); // Targeting #songs div
root.render(
  //<StrictMode>
    <App />
  //</StrictMode>
);
