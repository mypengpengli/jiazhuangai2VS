'use client'; // Needs client-side hooks (useAuth, useRouter, useEffect)

import React, { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAdmin = false }) => {
  const { token, user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // 等待认证状态加载完成
    if (!isLoading) {
      // 如果加载完成但没有 token (未登录)
      if (!token) {
        console.log('ProtectedRoute: No token found, redirecting to login.');
        router.replace('/login'); // 使用 replace 防止用户通过后退按钮回到受保护页面
      } else if (requireAdmin && user?.role !== 'admin') {
        console.log('ProtectedRoute: User is not admin, redirecting to profile.');
        router.replace('/profile');
      } else {
        console.log('ProtectedRoute: Token found, user is authenticated.');
      }
    }
  }, [token, user, isLoading, requireAdmin, router]); // 依赖项包括 token, isLoading 和 router

  // 如果正在加载认证状态，可以显示加载指示器
  if (isLoading) {
    return <div className="flex justify-center items-center min-h-[200px]">加载中...</div>; // 或者更复杂的骨架屏
  }

  // 如果已加载且有 token，则渲染子组件 (受保护的内容)
  // 如果没有 token，useEffect 中的重定向会生效，这里理论上不会渲染，但作为保险
  if (!token) {
    return null;
  }

  if (requireAdmin && user?.role !== 'admin') {
    return <div className="flex justify-center items-center min-h-[200px] text-red-500">无权限访问管理后台。</div>;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
