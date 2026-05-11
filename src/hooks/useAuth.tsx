import React, { useState, useEffect, createContext, useContext } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile, UserRole, OperationType } from '../types';
import { handleFirestoreError } from '../lib/error-handler';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, profile: Omit<UserProfile, 'uid' | 'createdAt'>) => Promise<void>;
  completeProfile: (profile: Omit<UserProfile, 'uid' | 'createdAt'>) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  setRole: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          } else {
            setProfile(null);
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
  }, []);

  const setRole = async (role: UserRole) => {
    if (!user) return;
    const profileData: UserProfile = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      role,
      createdAt: serverTimestamp() as any,
    };
    try {
      await setDoc(doc(db, 'users', user.uid), profileData);
      setProfile(profileData);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { signInWithPopup, GoogleAuthProvider } = await import('firebase/auth');
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
        console.log('Sign-in cancelled by user');
      } else {
        console.error('Authentication error:', error);
        throw error;
      }
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    const { signInWithEmailAndPassword } = await import('firebase/auth');
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const signUpWithEmail = async (email: string, pass: string, profileData: Omit<UserProfile, 'uid' | 'createdAt'>) => {
    const { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } = await import('firebase/auth');
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    
    // Trigger verification email
    try {
      await sendEmailVerification(userCredential.user);
    } catch (e) {
      console.error('Failed to send verification email:', e);
    }
    
    if (profileData.displayName) {
      await updateProfile(userCredential.user, { displayName: profileData.displayName });
    }

    const cleanProfile = (data: any) => {
      const cleaned = { ...data };
      Object.keys(cleaned).forEach(key => cleaned[key] === undefined && delete cleaned[key]);
      return cleaned;
    };

    const fullProfile: UserProfile = cleanProfile({
      ...profileData,
      uid: userCredential.user.uid,
      email: userCredential.user.email,
      createdAt: serverTimestamp() as any,
    }) as UserProfile;

    try {
      await setDoc(doc(db, 'users', userCredential.user.uid), fullProfile);
      setProfile(fullProfile);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${userCredential.user.uid}`);
    }
  };

  const completeProfile = async (profileData: Omit<UserProfile, 'uid' | 'createdAt'>) => {
    if (!user) throw new Error('No authenticated user');
    
    const cleanProfile = (data: any) => {
      const cleaned = { ...data };
      Object.keys(cleaned).forEach(key => cleaned[key] === undefined && delete cleaned[key]);
      return cleaned;
    };

    const fullProfile: UserProfile = cleanProfile({
      ...profileData,
      uid: user.uid,
      email: user.email,
      createdAt: serverTimestamp() as any,
    }) as UserProfile;

    try {
      await setDoc(doc(db, 'users', user.uid), fullProfile);
      setProfile(fullProfile);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
    }
  };

  const resetPassword = async (email: string) => {
    const { sendPasswordResetEmail } = await import('firebase/auth');
    await sendPasswordResetEmail(auth, email);
  };

  const signOut = async () => {
    await auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      signInWithGoogle, 
      signInWithEmail, 
      signUpWithEmail, 
      completeProfile,
      resetPassword,
      signOut, 
      setRole 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
