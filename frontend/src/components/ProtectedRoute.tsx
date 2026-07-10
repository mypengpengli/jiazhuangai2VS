'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface ProtectedRouteProps { children: ReactNode; requireAdmin?: boolean; }

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { token, user, isLoading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (isLoading) return;
    if (!token) router.replace('/login');
    else if (requireAdmin && user?.role !== 'admin') router.replace('/profile');
  }, [isLoading, requireAdmin, router, token, user?.role]);
  if (isLoading) return <div className="page-shell flex min-h-[45vh] items-center justify-center text-sm text-slate-500">正在验证登录状态...</div>;
  if (!token || (requireAdmin && user?.role !== 'admin')) return null;
  return <>{children}</>;
}
