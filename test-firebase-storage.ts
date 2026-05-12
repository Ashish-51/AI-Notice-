import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './src/lib/firebase';
import fs from 'fs';

async function testStorage() {
  try {
    const storageRef = ref(storage, 'test.txt');
    const blob = new Blob(['test'], { type: 'text/plain' });
    await uploadBytes(storageRef, blob);
    const url = await getDownloadURL(storageRef);
    console.log("Firebase storage url:", url);
  } catch (e) {
    console.error("Firebase Storage failed:", e);
  }
}
testStorage();
