'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface User {
  id: number;
  username: string;
  is_guest: boolean;
  is_admin?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  loginAsGuest: () => Promise<void>;
  logout: () => void;
  socialLogin: (provider: 'google' | 'facebook', token: string, email?: string, name?: string, socialId?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing token on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('quran_auth_token');
    const storedUser = localStorage.getItem('quran_user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    
    setIsLoading(false);
  }, []);

  // Set up axios interceptor for authentication
  useEffect(() => {
    const interceptor = axios.interceptors.request.use(
      (config) => {
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    return () => {
      axios.interceptors.request.eject(interceptor);
    };
  }, [token]);

  const login = useCallback(async (username: string, password: string) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        username,
        password
      });

      const { access_token, user: userData } = response.data;
      
      setToken(access_token);
      setUser(userData);
      
      localStorage.setItem('quran_auth_token', access_token);
      localStorage.setItem('quran_user', JSON.stringify(userData));
    } catch (error) {
      throw error;
    }
  }, []);

  const register = useCallback(async (username: string, password: string) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/register`, {
        username,
        password
      });

      const { access_token, user: userData } = response.data;
      
      setToken(access_token);
      setUser(userData);
      
      localStorage.setItem('quran_auth_token', access_token);
      localStorage.setItem('quran_user', JSON.stringify(userData));
    } catch (error) {
      throw error;
    }
  }, []);

  const loginAsGuest = useCallback(async () => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/guest`);

      const { access_token, user: userData } = response.data;
      
      setToken(access_token);
      setUser(userData);
      
      localStorage.setItem('quran_auth_token', access_token);
      localStorage.setItem('quran_user', JSON.stringify(userData));
    } catch (error) {
      throw error;
    }
  }, []);

  const socialLogin = useCallback(async (
    provider: 'google' | 'facebook',
    token: string,
    email?: string,
    name?: string,
    socialId?: string
  ) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/social`, {
        provider,
        token,
        email,
        name,
        social_id: socialId
      });

      const { access_token, user: userData } = response.data;
      
      setToken(access_token);
      setUser(userData);
      
      localStorage.setItem('quran_auth_token', access_token);
      localStorage.setItem('quran_user', JSON.stringify(userData));
    } catch (error) {
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('quran_auth_token');
    localStorage.removeItem('quran_user');
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        loginAsGuest,
        logout,
        socialLogin
      }}
    >
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
