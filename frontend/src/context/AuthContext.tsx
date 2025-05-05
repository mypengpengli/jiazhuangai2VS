'use client'; // Context needs to be used in client components

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { User } from '@/types/models'; // Assuming User type is defined

// 定义 Context 中值的类型
interface AuthContextType {
  token: string | null;
  user: User | null; // 可以添加用户信息的类型
  isLoading: boolean; // 用于处理初始加载状态
  login: (newToken: string, userData?: User) => void; // 登录函数，接收 token 和可选的用户数据
  logout: () => void; // 注销函数
}

// 创建 Context，提供默认值
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 创建 Provider 组件
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // 初始时为加载状态

  // 在组件挂载时尝试从 localStorage 加载 token
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('authToken');
      if (storedToken) {
        setToken(storedToken);
        // TODO: Optionally fetch user data based on the stored token here
        // For now, we assume token presence means logged in, but no user data yet
        // setUser(fetchedUserData);
        console.log('AuthContext: Loaded token from localStorage.');
      }
    } catch (error) {
        console.error("AuthContext: Error reading localStorage", error);
    } finally {
        setIsLoading(false); // 加载完成
    }
  }, []);

  // 登录函数
  const login = (newToken: string, userData?: User) => {
    try {
        localStorage.setItem('authToken', newToken);
        setToken(newToken);
        setUser(userData || null); // 设置用户数据，如果没有提供则为 null
        console.log('AuthContext: User logged in, token stored.');
    } catch (error) {
        console.error("AuthContext: Error writing to localStorage", error);
        // Handle potential storage errors (e.g., storage full, security restrictions)
        // Maybe notify the user or fallback
    }
  };

  // 注销函数
  const logout = () => {
     try {
        localStorage.removeItem('authToken');
        setToken(null);
        setUser(null);
        console.log('AuthContext: User logged out, token removed.');
        // TODO: Optionally redirect to login page or home page
        // router.push('/login');
     } catch (error) {
         console.error("AuthContext: Error removing item from localStorage", error);
     }
  };

  // 准备要传递给 Context 的值
  const value = {
    token,
    user,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// 创建自定义 Hook 以方便使用 Context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};