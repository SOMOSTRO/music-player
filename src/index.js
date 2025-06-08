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

// Check available storage space
if (navigator.storage && navigator.storage.estimate) {
  const { usage, quota } = await navigator.storage.estimate();
  const usageMB = usage / 1024 / 1024;
  const quotaMB = quota / 1024 / 1024;
  const quotaGB = quota / 1024 / 1024 / 1024;
  const percentUsed = ((usage / quota) * 100).toFixed(2);
  
  const quotaDisplay = quotaGB >= 1 ? `${quotaGB.toFixed(2)} GB`:
    `${quotaMB.toFixed(2)} MB`;
  
  console.log(`Used: ${usageMB.toFixed(2)} MB \nTotal: ${quotaDisplay}\nStorage Used: ${percentUsed}%`);
  if (percentUsed >= 90)
    alert("Warning: Your storage is nearly full! Please remove some songs.");
} else {
  console.warn("Failed to access browser storage, cannot calculate available storage space.");
}



const root = ReactDOM.createRoot(document.getElementById('root')); // Targeting #songs div
root.render(
  //<StrictMode>
    <App />
  //</StrictMode>
);
