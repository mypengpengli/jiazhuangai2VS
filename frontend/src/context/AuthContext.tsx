'use client'; // Context needs to be used in client components

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode'; // 导入 jwt-decode
import { User, DecodedToken } from '@/types/models'; // 导入 User 和 DecodedToken 类型

// 定义 Context 中值的类型
interface AuthContextType {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  login: (newToken: string) => void; // 登录函数，现在只接收 token
  logout: () => void;
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
        try {
          const decodedToken = jwtDecode<DecodedToken>(storedToken);
          // 检查 token 是否过期
          const currentTime = Date.now() / 1000; // 转换为秒
          if (decodedToken.exp > currentTime) {
            setToken(storedToken);
            setUser({
              id: decodedToken.sub,
              username: decodedToken.username,
              role: decodedToken.role,
            });
            console.log('AuthContext: Loaded and validated token from localStorage. User set.');
          } else {
            console.log('AuthContext: Token from localStorage has expired.');
            localStorage.removeItem('authToken'); // 清除过期的 token
          }
        } catch (decodeError) {
          console.error('AuthContext: Error decoding token from localStorage', decodeError);
          localStorage.removeItem('authToken'); // 清除无效的 token
        }
      }
    } catch (error) {
        console.error("AuthContext: Error reading localStorage", error);
    } finally {
        setIsLoading(false); // 加载完成
    }
  }, []);

  // 登录函数
  const login = (newToken: string) => {
    setIsLoading(true); // 开始登录，设置加载状态
    try {
      const decodedToken = jwtDecode<DecodedToken>(newToken);
      localStorage.setItem('authToken', newToken);
      setToken(newToken);
      setUser({
        id: decodedToken.sub,
        username: decodedToken.username,
        role: decodedToken.role,
      });
      console.log('AuthContext: User logged in, token stored, user data set from token.');
    } catch (error) {
      console.error("AuthContext: Error processing login", error);
      setToken(null);
      setUser(null);
      localStorage.removeItem('authToken');
    } finally {
      setIsLoading(false); // 登录处理完成（无论成功或失败）
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