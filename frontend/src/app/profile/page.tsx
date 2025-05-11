'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

const ProfilePage = () => {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login'); // 登出后跳转到登录页
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-gray-700">加载中...</p>
      </div>
    );
  }

  if (!user) {
    // 如果没有用户信息，理论上 AuthContext 会处理或 ProtectedRoute 会拦截
    // 但作为后备，可以提示用户登录或重定向
    // router.push('/login'); // 可以在 useEffect 中执行以避免渲染问题
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
        <div className="p-8 bg-white shadow-md rounded-lg text-center">
          <p className="text-lg text-red-600 mb-4">您尚未登录。</p>
          <button
            onClick={() => router.push('/login')}
            className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            前往登录
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 p-10 bg-white shadow-xl rounded-xl">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            个人资料
          </h2>
        </div>
        <div className="mt-8 space-y-6">
          <div className="rounded-md shadow-sm -space-y-px">
            <div className="p-3 border-gray-200 border-b">
              <p className="text-sm font-medium text-gray-500">用户ID:</p>
              <p className="text-md text-gray-900">{user.id}</p>
            </div>
            <div className="p-3 border-gray-200 border-b">
              <p className="text-sm font-medium text-gray-500">用户名:</p>
              <p className="text-md text-gray-900">{user.username}</p>
            </div>
            {user.role && (
              <div className="p-3">
                <p className="text-sm font-medium text-gray-500">角色:</p>
                <p className="text-md text-gray-900 capitalize">{user.role}</p>
              </div>
            )}
          </div>

          <div>
            <button
              onClick={handleLogout}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              登出
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;