import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Lazy initialize storage to avoid "Service storage is not available" startup crash
let storageInstance: FirebaseStorage | null = null;
export const getStorageInstance = () => {
  if (!storageInstance) {
    storageInstance = getStorage(app);
  }
  return storageInstance;
};

export const storage = getStorage(app);

async function testConnection() {
  try {
    // Attempt a silent server-side read to check connectivity
    await getDocFromServer(doc(db, 'system', 'health'));
  } catch (error) {
    if(error instanceof Error) {
      const msg = error.message.toLowerCase();
      // "Insufficient permissions" actually means we ARE connected to the server
      if (msg.includes('permission') || msg.includes('insufficient')) {
        return; 
      }
      if (msg.includes('offline') || msg.includes('unavailable')) {
        console.warn("Firestore is unavailable or offline. The app will continue in offline mode.");
      } else {
        console.error("Firestore connectivity check failed:", error.message);
      }
    }
  }
}
testConnection();
