'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role?: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface UserContextType {
  user: User | null;
  tokens: AuthTokens | null;
  isLoggedIn: boolean;
  login: (userData: User, authTokens?: AuthTokens) => void;
  logout: () => void;
  updateTokens: (authTokens: AuthTokens) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);

  // Load user data from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('cinema_user');
    const savedTokens = localStorage.getItem('cinema_tokens');
    
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error parsing saved user data:', error);
        localStorage.removeItem('cinema_user');
      }
    }
    
    if (savedTokens) {
      try {
        setTokens(JSON.parse(savedTokens));
      } catch (error) {
        console.error('Error parsing saved tokens:', error);
        localStorage.removeItem('cinema_tokens');
      }
    }
  }, []);

  const login = (userData: User, authTokens?: AuthTokens) => {
    setUser(userData);
    localStorage.setItem('cinema_user', JSON.stringify(userData));
    
    if (authTokens) {
      setTokens(authTokens);
      localStorage.setItem('cinema_tokens', JSON.stringify(authTokens));
    }
  };

  const logout = () => {
    setUser(null);
    setTokens(null);
    localStorage.removeItem('cinema_user');
    localStorage.removeItem('cinema_tokens');
  };

  const updateTokens = (authTokens: AuthTokens) => {
    setTokens(authTokens);
    localStorage.setItem('cinema_tokens', JSON.stringify(authTokens));
  };

  const value = {
    user,
    tokens,
    isLoggedIn: !!user,
    login,
    logout,
    updateTokens,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}