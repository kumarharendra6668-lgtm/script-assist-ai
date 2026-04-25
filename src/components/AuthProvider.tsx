import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

interface UserProfile {
  email: string;
  signupDate: any;
  plan: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, profile: null, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // Fetch or create user profile
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const docSnap = await getDoc(userDocRef);
          
          if (!docSnap.exists()) {
            const newProfile = {
              email: firebaseUser.email || '',
              signupDate: serverTimestamp(),
              plan: 'Trial'
            };
            await setDoc(userDocRef, newProfile);
            // After creation, we just set the local profile (serverTimestamp won't be available immediately as a date)
            setProfile({ email: newProfile.email, signupDate: new Date(), plan: newProfile.plan });
          } else {
            setProfile(docSnap.data() as UserProfile);
          }
        } catch (error) {
          console.error("Error fetching/creating user document:", error);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
