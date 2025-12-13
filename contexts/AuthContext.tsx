import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, googleProvider, ADMIN_EMAIL, db } from '../services/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { UserProfile, UserRole } from '../types.ts';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signupWithEmail: (email: string, pass: string, name: string, role?: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (firebaseUser: User) => {
      // Check Firestore for user role
      let role = UserRole.CUSTOMER;
      
      if (firebaseUser.email === ADMIN_EMAIL) {
          role = UserRole.ADMIN;
      } else {
          // Try to fetch custom role from 'users' collection
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
              const data = userDoc.data();
              if (data.role) role = data.role;
          }
      }

      setUser({
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || '사용자',
        photoURL: firebaseUser.photoURL || '',
        role,
      });
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await fetchUserData(firebaseUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshProfile = async () => {
      if (auth.currentUser) {
          await fetchUserData(auth.currentUser);
      }
  };

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      // Create user doc if not exists
      const userDocRef = doc(db, 'users', result.user.uid);
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
            email: result.user.email,
            name: result.user.displayName,
            role: UserRole.CUSTOMER, // Default to customer for Google login
            createdAt: new Date()
        });
      }
      await refreshProfile(); // Ensure role is loaded
    } catch (error) {
      console.error("Google Login failed", error);
      throw error;
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
        console.error("Email Login failed", error);
        throw error;
    }
  }

  const signupWithEmail = async (email: string, pass: string, name: string, role: UserRole = UserRole.CUSTOMER) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        await updateProfile(userCredential.user, {
            displayName: name
        });
        
        // Save additional user info including role
        await setDoc(doc(db, 'users', userCredential.user.uid), {
            email,
            name,
            role,
            createdAt: new Date()
        });
        
        // Force refresh to get the role
        await fetchUserData(userCredential.user);

    } catch (error) {
        console.error("Signup failed", error);
        throw error;
    }
  }

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, loginWithEmail, signupWithEmail, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};