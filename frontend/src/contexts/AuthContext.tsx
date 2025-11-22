'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import Cookies from 'js-cookie';

interface User {
  id: number;
  username: string;
  email: string;
  full_name?: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async (skipLoading = false) => {
    try {
      const token = Cookies.get('token');
      if (!token) {
        setUser(null);
        if (!skipLoading) {
          setLoading(false);
        }
        return;
      }

      const response = await api.get('/auth/profile');
      if (response.data?.user) {
        setUser(response.data.user);
      } else {
        setUser(null);
        Cookies.remove('token');
      }
    } catch (error: any) {
      // Only remove token if it's a 401 (unauthorized) error
      if (error.response?.status === 401) {
        Cookies.remove('token');
        setUser(null);
      }
      // For other errors, don't clear the user state - might be a network issue
    } finally {
      if (!skipLoading) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (username: string, password: string) => {
    const response = await api.post('/auth/login', { username, password });
    if (response.data?.user) {
      setUser(response.data.user);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Ignore errors
    } finally {
      Cookies.remove('token');
      setUser(null);
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      isAuthenticated: !!user,
      login, 
      logout, 
      updateUser,
      checkAuth 
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

