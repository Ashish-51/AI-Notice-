import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  where,
  limit,
  Timestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Notice, OperationType } from '../types';
import { handleFirestoreError } from '../lib/error-handler';

export function useNotices() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'notices'),
      orderBy('isPinned', 'desc'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const noticesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Notice[];
        setNotices(noticesData);
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'notices');
      }
    );

    return () => unsubscribe();
  }, []);

  return { notices, loading };
}
