'use client';

import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { DecodedToken, User } from '@/types/models';

interface AuthContextType {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  login: (newToken: string) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

interface AuthProviderProps {
  children: ReactNode;
}

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8787';
const AuthContext = createContext<AuthContextType | undefined>(undefined);

const decodeUser = (token: string): User => {
  const decodedToken = jwtDecode<DecodedToken>(token);

  return {
    id: decodedToken.sub,
    username: decodedToken.username,
    role: decodedToken.role,
  };
};

const isTokenValid = (token: string): boolean => {
  const decodedToken = jwtDecode<DecodedToken>(token);
  return decodedToken.exp > Date.now() / 1000;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearAuth = useCallback(() => {
    localStorage.removeItem('authToken');
    setToken(null);
    setUser(null);
  }, []);

  const fetchUserProfile = useCallback(async (activeToken: string, fallbackUser?: User) => {
    try {
      const response = await fetch(`${backendUrl}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${activeToken}`,
        },
      });

      if (response.status === 401) {
        clearAuth();
        return;
      }

      if (!response.ok) {
        return;
      }

      const profile = await response.json();
      setUser({
        id: String(profile.id),
        username: profile.username || fallbackUser?.username || '',
        role: profile.role || fallbackUser?.role,
        display_name: profile.display_name,
        bio: profile.bio,
        created_at: profile.created_at,
      });
    } catch (error) {
      console.error('AuthContext: failed to fetch user profile', error);
    }
  }, [clearAuth]);

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('authToken');

      if (storedToken && isTokenValid(storedToken)) {
        const decodedUser = decodeUser(storedToken);
        setToken(storedToken);
        setUser(decodedUser);
        void fetchUserProfile(storedToken, decodedUser);
      } else if (storedToken) {
        localStorage.removeItem('authToken');
      }
    } catch (error) {
      console.error('AuthContext: failed to load token', error);
      localStorage.removeItem('authToken');
    } finally {
      setIsLoading(false);
    }
  }, [fetchUserProfile]);

  const login = (newToken: string) => {
    setIsLoading(true);

    try {
      const decodedUser = decodeUser(newToken);
      localStorage.setItem('authToken', newToken);
      setToken(newToken);
      setUser(decodedUser);
      void fetchUserProfile(newToken, decodedUser);
    } catch (error) {
      console.error('AuthContext: failed to process login', error);
      clearAuth();
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    try {
      clearAuth();
    } catch (error) {
      console.error('AuthContext: failed to clear auth', error);
    }
  };

  const refreshUser = async () => {
    if (token) {
      await fetchUserProfile(token, user || undefined);
    }
  };

  return (
    <AuthContext.Provider value={{ token, user, isLoading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};
