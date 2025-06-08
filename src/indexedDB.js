const DB_NAME = "MusicPlayerDB";
const DB_VERSION = 1;
const STORE_NAME = "favourites";

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject("Error opening IndexedDB");
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "song" });
      }
    };
  });
}

export async function saveFavourite(song, blob) {
  if (!blob || blob.size === 0) {
    console.warn(`"${song}" not saved: blob is empty`);
    return;
  }

  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.put({ song, blob });

    request.onsuccess = () => {
      console.log(`"${song}" successfully saved in IndexedDB (size: ${(blob.size / 1024 / 1024).toFixed(2)} MB)`);
      resolve();
    };

    request.onerror = (e) => {
      console.error(`Failed to save "${song}" to IndexedDB:`, e.target.error);
      reject(e.target.error);
    };
    
    tx.onerror = () => {
      console.error("Transaction failed");
      reject(new Error("Transaction error"));
    };
  });
}

export async function removeFavourite(song) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(song);

    request.onsuccess = () => {
      console.log(`${song} removed from IndexedDB`);
      resolve();
    };
    request.onerror = () => {
      console.error(`Failed to remove ${song} from IndexedDB`);
      reject();
    };
    
    tx.onerror = () => {
      console.error("Transaction failed");
      reject(new Error("Transaction error"));
    };
  });
}

export async function getAllFavourites() {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readonly");
  const store = tx.objectStore(STORE_NAME);
  return new Promise((resolve) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = (e) => {
      console.error("Failed to get all favourites:", e.target.error);
      resolve([]); // or reject if you want to propagate
    };
  });
}

export async function getFavourite(song) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(song);

    request.onsuccess = () => {
      const result = request.result;
      if (result?.blob && result.blob.size > 0) {
        console.log(`"${song}" found in IndexedDB (size: ${(result.blob.size / 1024 / 1024).toFixed(2)} MB)`);
        resolve(result.blob);
      } else {
        console.warn(`"${song}" found in IndexedDB but blob is empty or invalid`);
        reject(new Error("Blob is missing or empty"));
      }
    };

    request.onerror = (e) => {
      console.error(`Error reading "${song}" from IndexedDB:`, e.target.error);
      reject(e.target.error);
    };
  });
}