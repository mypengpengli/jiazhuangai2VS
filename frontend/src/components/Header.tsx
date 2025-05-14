'use client'; // Header needs to be a client component to use context

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext'; // Import useAuth hook

const Header: React.FC = () => {
  // Remove unused 'user' from destructuring
  const { token, isLoading, logout } = useAuth(); // Get auth state and functions

  const handleLogout = () => {
    logout();
    // Optionally redirect after logout
    // router.push('/');
  };

  return (
    <header className="bg-blue-600 text-white shadow-md">
      <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold hover:text-blue-200">
          家装AI助手
        </Link>
        <div className="flex items-center space-x-4">
          <Link href="/articles" className="px-3 py-2 hover:bg-blue-700 rounded">
            文章列表
          </Link>
          <Link href="/categories" className="px-3 py-2 hover:bg-blue-700 rounded">
            分类
          </Link>

          {/* Auth Links */}
          {isLoading ? (
            <span className="px-3 py-2 text-sm">加载中...</span>
          ) : token ? (
            <>
              {/* TODO: Add Profile Link */}
              {/* <Link href="/profile" className="px-3 py-2 hover:bg-blue-700 rounded">
                {user?.username || '个人资料'}
              </Link> */}
              <button
                onClick={handleLogout}
                className="px-3 py-2 bg-red-500 hover:bg-red-600 rounded text-white"
              >
                注销
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="px-3 py-2 hover:bg-blue-700 rounded">
                登录
              </Link>
              <Link href="/register" className="px-3 py-2 bg-green-500 hover:bg-green-600 rounded text-white">
                注册
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;