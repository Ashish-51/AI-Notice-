import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc } from 'firebase/firestore';
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


