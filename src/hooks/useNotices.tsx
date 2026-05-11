import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  where,
  limit,
  or,
  and
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Notice, OperationType } from '../types';
import { handleFirestoreError } from '../lib/error-handler';
import { useAuth } from './useAuth';

export function useNotices() {
  const { profile } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) {
      setNotices([]);
      setLoading(false);
      return;
    }

    // Dynamic filtering based on user profile
    const institution = profile.institution || '';
    const department = profile.department || '';
    const semester = profile.semester || '';

    let q;
    
    if (profile.role === 'teacher' || profile.institution === 'Parul University') {
      // Teachers/Admin see faculty notices + Everyone notices
      const faculties = [institution || 'Unknown', 'Parul University'];
      
      if (profile.institution === 'Parul University') {
        q = query(
          collection(db, 'notices'),
          orderBy('createdAt', 'desc'),
          limit(100)
        );
      } else {
        q = query(
          collection(db, 'notices'),
          where('faculty', 'in', faculties),
          orderBy('createdAt', 'desc'),
          limit(100)
        );
      }
    } else {
      // Students visibility logic:
      const safeInstitution = institution || 'Unknown';
      const safeDept = department || 'None';
      const safeSem = semester || '0';
      
      q = query(
        collection(db, 'notices'),
        or(
          where('audienceType', '==', 'Everyone'),
          and(where('audienceType', '==', 'Entire Faculty'), where('faculty', '==', safeInstitution)),
          and(where('audienceType', '==', 'Specific Course'), where('faculty', '==', safeInstitution), where('department', '==', safeDept)),
          and(where('audienceType', '==', 'Specific Semester'), where('faculty', '==', safeInstitution), where('department', '==', safeDept), where('semester', '==', safeSem))
        ),
        orderBy('createdAt', 'desc'),
        limit(100)
      );
    }

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
        // If it's a "missing index" error, we will log it for the user
        handleFirestoreError(error, OperationType.LIST, 'notices');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [profile]);

  return { notices, loading };
}
