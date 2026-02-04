import { useState, useEffect, useCallback } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile as updateFirebaseProfile,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '@/lib/firebase';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  phone?: string;
  address?: string;
  createdAt: string;
  isAdmin?: boolean;
  profileImage?: string;
}

const STORAGE_KEY = 'auth_user';
const USERS_KEY = 'app_users';
const ADMIN_EMAILS = ['admin@example.com'];

// Initialize sample users
const initializeSampleUsers = () => {
  const existingUsers = localStorage.getItem(USERS_KEY);
  if (!existingUsers) {
    const sampleUsers: User[] = [
      {
        id: '1',
        name: 'Demo User',
        email: 'demo@example.com',
        password: 'password123',
        phone: '0812345678',
        address: 'Bangkok, Thailand',
        createdAt: new Date().toISOString(),
        isAdmin: false,
      },
      {
        id: '2',
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'admin123',
        phone: '0899999999',
        address: 'Bangkok, Thailand',
        createdAt: new Date().toISOString(),
        isAdmin: true,
      },
    ];
    localStorage.setItem(USERS_KEY, JSON.stringify(sampleUsers));
  }
};

export const useAuth = () => {
  const [user, setUser] = useState<(Omit<User, 'password'>) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user from storage on mount
  useEffect(() => {
    if (!isFirebaseConfigured) {
      initializeSampleUsers();
      const storedUser = localStorage.getItem(STORAGE_KEY);
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (err) {
          console.error('Failed to parse stored user:', err);
        }
      }
      setLoading(false);
      return;
    }

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const userRef = doc(db, 'users', firebaseUser.uid);
        const snap = await getDoc(userRef);
        const fallbackName = firebaseUser.displayName || '';
        const fallbackEmail = firebaseUser.email || '';

        if (!snap.exists()) {
          const createdAt = new Date().toISOString();
          await setDoc(userRef, {
            name: fallbackName,
            email: fallbackEmail,
            phone: '',
            address: '',
            isAdmin: false,
            profileImage: '',
            createdAt,
            createdAtServer: serverTimestamp(),
          });
        }

        const data = snap.exists() ? snap.data() : {};
        const resolvedEmail = (data?.email as string) || fallbackEmail;
        const resolvedIsAdmin = Boolean(data?.isAdmin) || ADMIN_EMAILS.includes(resolvedEmail);

        if (ADMIN_EMAILS.includes(resolvedEmail) && !data?.isAdmin) {
          await updateDoc(userRef, { isAdmin: true });
        }
        setUser({
          id: firebaseUser.uid,
          name: (data?.name as string) || fallbackName,
          email: resolvedEmail,
          phone: (data?.phone as string) || '',
          address: (data?.address as string) || '',
          isAdmin: resolvedIsAdmin,
          profileImage: (data?.profileImage as string) || '',
          createdAt: (data?.createdAt as string) || new Date().toISOString(),
        });
      } catch (err) {
        console.error('Failed to load user profile:', err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    if (isFirebaseConfigured) {
      try {
        await signInWithEmailAndPassword(auth, email, password);
        return;
      } catch (err) {
        setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
        throw err;
      }
    }

    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        try {
          const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]') as User[];
          const foundUser = users.find((u) => u.email === email && u.password === password);

          if (!foundUser) {
            setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
            reject(new Error('Invalid credentials'));
            return;
          }

          const { password: _, ...userWithoutPassword } = foundUser;
          setUser(userWithoutPassword);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(userWithoutPassword));
          resolve();
        } catch (err) {
          setError('เกิดข้อผิดพลาด');
          reject(err);
        }
      }, 500);
    });
  }, []);

  const signup = useCallback(
    async (name: string, email: string, password: string, phone?: string) => {
      setError(null);
      if (isFirebaseConfigured) {
        try {
          if (password.length < 6) {
            setError('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
            throw new Error('Password too short');
          }

          const cred = await createUserWithEmailAndPassword(auth, email, password);
          if (name) {
            await updateFirebaseProfile(cred.user, { displayName: name });
          }

          await setDoc(doc(db, 'users', cred.user.uid), {
            name,
            email,
            phone: phone || '',
            address: '',
            isAdmin: false,
            profileImage: '',
            createdAt: new Date().toISOString(),
            createdAtServer: serverTimestamp(),
          });

          return;
        } catch (err) {
          if ((err as { code?: string })?.code === 'auth/email-already-in-use') {
            setError('อีเมลนี้มีการลงทะเบียนแล้ว');
          } else {
            setError('เกิดข้อผิดพลาด');
          }
          throw err;
        }
      }

      return new Promise<void>((resolve, reject) => {
        setTimeout(() => {
          try {
            const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]') as User[];

            if (users.some((u) => u.email === email)) {
              setError('อีเมลนี้มีการลงทะเบียนแล้ว');
              reject(new Error('Email already exists'));
              return;
            }

            if (password.length < 6) {
              setError('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
              reject(new Error('Password too short'));
              return;
            }

            const newUser: User = {
              id: Date.now().toString(),
              name,
              email,
              password,
              phone: phone || '',
              address: '',
              createdAt: new Date().toISOString(),
              isAdmin: false,
            };

            users.push(newUser);
            localStorage.setItem(USERS_KEY, JSON.stringify(users));

            const { password: _, ...userWithoutPassword } = newUser;
            setUser(userWithoutPassword);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(userWithoutPassword));
            resolve();
          } catch (err) {
            setError('เกิดข้อผิดพลาด');
            reject(err);
          }
        }, 500);
      });
    },
    []
  );

  const logout = useCallback(async () => {
    setUser(null);
    setError(null);

    if (isFirebaseConfigured) {
      await signOut(auth);
      return;
    }

    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const updateProfile = useCallback(async (updates: Partial<Omit<User, 'password'>>) => {
    if (isFirebaseConfigured) {
      const current = auth.currentUser;
      if (!current) return;

      const userRef = doc(db, 'users', current.uid);
      await updateDoc(userRef, updates as Record<string, unknown>);

      if (updates.name) {
        await updateFirebaseProfile(current, { displayName: updates.name });
      }

      setUser((prevUser) => (prevUser ? { ...prevUser, ...updates } : prevUser));
      return;
    }

    setUser((prevUser) => {
      if (!prevUser) return null;
      const updatedUser = { ...prevUser, ...updates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
      return updatedUser;
    });
  }, []);

  const changePassword = useCallback(async (oldPassword: string, newPassword: string) => {
    if (!isFirebaseConfigured) {
      setError('โหมดทดสอบไม่รองรับการเปลี่ยนรหัสผ่านแบบจริง');
      throw new Error('Not supported in local mode');
    }

    const current = auth.currentUser;
    if (!current || !current.email) {
      setError('ไม่พบผู้ใช้งาน');
      throw new Error('No authenticated user');
    }

    if (newPassword.length < 6) {
      setError('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      throw new Error('Password too short');
    }

    const credential = EmailAuthProvider.credential(current.email, oldPassword);
    await reauthenticateWithCredential(current, credential);
    await updatePassword(current, newPassword);
  }, []);

  return {
    user,
    loading,
    error,
    login,
    signup,
    logout,
    updateProfile,
    changePassword,
  };
};
