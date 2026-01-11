import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types';
import { api } from '@/lib/apiAdapter';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  setCurrentUser: (user: User | null) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Store user in sessionStorage for persistence
const STORAGE_KEY = 'app_current_user';

function getStoredUser(): User | null {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function setStoredUser(user: User | null) {
  if (user) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } else {
    sessionStorage.removeItem(STORAGE_KEY);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to restore user from sessionStorage
    const storedUser = getStoredUser();
    if (storedUser) {
      setUser(storedUser);
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const loggedInUser = await api.login(email, password);
      if (loggedInUser && loggedInUser.id) {
        setUser(loggedInUser);
        setStoredUser(loggedInUser);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      // Check if it's a network error (backend not running)
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('Backend nicht erreichbar. Stellen Sie sicher, dass das Backend auf http://localhost:8080 läuft.');
      }
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setStoredUser(null);
  };

  const setCurrentUser = (newUser: User | null) => {
    setUser(newUser);
    setStoredUser(newUser);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, setCurrentUser, loading }}>
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

