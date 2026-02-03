import { useState, useEffect, useCallback } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
  createdAt: string;
  isAdmin?: boolean;
}

const STORAGE_KEY = 'auth_user';
const USERS_KEY = 'app_users';

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
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
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

  const logout = useCallback(() => {
    setUser(null);
    setError(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const updateProfile = useCallback((updates: Partial<Omit<User, 'password'>>) => {
    setUser((prevUser) => {
      if (!prevUser) return null;
      const updatedUser = { ...prevUser, ...updates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
      return updatedUser;
    });
  }, []);

  return {
    user,
    loading,
    error,
    login,
    signup,
    logout,
    updateProfile,
  };
};
