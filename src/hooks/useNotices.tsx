import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  where,
  limit,
  doc,
  deleteDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Notice, OperationType } from '../types';
import { handleFirestoreError } from '../lib/error-handler';
import { useAuth } from './useAuth';
import toast from 'react-hot-toast';

export function useNotices() {
  const { profile, user } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  const deleteNotice = useCallback(async (noticeId: string, attachmentUrl?: string) => {
    if (!user) return;
    const toastId = toast.loading("Deleting notice...");
    try {
      await deleteDoc(doc(db, 'notices', noticeId));
      toast.success("Notice deleted successfully", { id: toastId });
    } catch (error) {
      toast.error("Failed to delete notice", { id: toastId });
      handleFirestoreError(error, OperationType.DELETE, `notices/${noticeId}`);
    }
  }, [user]);

  useEffect(() => {
    if (!profile) {
      setNotices([]);
      setLoading(false);
      return;
    }

    const institution = profile.institution || '';
    const department = profile.department || '';

    // We fetch a broader set of notices and filter client-side for strict control
    // including expiry logic and the specific visibility rules requested.
    let q = query(
      collection(db, 'notices'),
      orderBy('createdAt', 'desc'),
      limit(150)
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const now = new Date();
        const noticesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Notice[];

        const filtered = noticesData.filter(notice => {
          // 1. Expiry Check
          if (notice.expiryDateTime) {
            const expiry = notice.expiryDateTime.toDate();
            if (expiry < now) return false;
          }

          // 2. Admin/Teacher View Logic
          if (profile.role === 'teacher' || profile.institution === 'Parul University') {
            // Admins see everything. Teachers see their institution notices.
            if (profile.institution === 'Parul University') return true;
            return notice.faculty === institution || notice.faculty === 'Parul University';
          }

          // 3. Student Visibility Logic (Strict Rule)
          const isFacultyMatch = (notice.faculty === institution) || (notice.faculty === 'Parul University');
          
          if (!isFacultyMatch) return false;

          const isCourseMatch = notice.department === department;
          const isGeneralAudience = notice.audienceType === 'Everyone' || notice.audienceType === 'Entire Faculty';

          return isCourseMatch || isGeneralAudience;
        });

        setNotices(filtered);
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'notices');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [profile]);

  return { notices, loading, deleteNotice };
}
