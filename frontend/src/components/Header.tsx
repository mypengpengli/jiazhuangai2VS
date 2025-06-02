'use client'; // Header needs to be a client component to use context

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext'; // Import useAuth hook

// 定义导航分类
const categories = [
  { name: 'AI新鲜事', href: '/', slug: 'all' },
  { name: '大语言模型', href: '/articles?category_slug=language-models', slug: 'language-models' },
  { name: '生图模型', href: '/articles?category_slugs=3d-generation,image-generation', slug: 'image-generation' },
  { name: '视频模型', href: '/articles?category_slug=video-models', slug: 'video-models' },
  { name: '音频模型', href: '/articles?category_slugs=voice-models,music-models', slug: 'audio-models' },
  { name: 'AI硬件', href: '/articles?category_slug=ai-hardware', slug: 'ai-hardware' },
  { name: 'AI工具', href: '/articles?category_slugs=ai-open-source-tools,ai-proprietary-tools', slug: 'ai-tools' },
  { name: '关于我们', href: '/about', slug: 'about' },
];

const Header: React.FC = () => {
  const { user, token, isLoading, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="bg-gradient-to-r from-blue-600 to-purple-700 text-white shadow-xl">
      <nav className="container mx-auto px-4">
        {/* 顶部栏 - Logo和用户操作 */}
        <div className="flex justify-between items-center py-4">
          <Link href="/">
            <span className="text-2xl font-bold hover:text-yellow-300 transition-colors duration-300">
              🏠 家装AI助手
            </span>
          </Link>
          
          <div className="flex items-center space-x-2">
            {/* 移动端菜单按钮 */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* 桌面端用户操作 */}
            <div className="hidden md:flex items-center space-x-2">
              {isLoading ? (
                <div className="px-4 py-2 text-sm animate-pulse">加载中...</div>
              ) : token ? (
                <div className="flex items-center space-x-2">
                  <Link href="/profile">
                    <span className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full transition-all duration-300 text-sm font-medium">
                      👤 {user?.username || '个人资料'}
                    </span>
                  </Link>
                  {user?.role === 'admin' && (
                    <Link href="/admin">
                      <span className="px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-full transition-all duration-300 text-sm font-medium">
                        ⚙️ 管理后台
                      </span>
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-full transition-all duration-300 text-sm font-medium"
                  >
                    🚪 注销
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link href="/login">
                    <span className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full transition-all duration-300 text-sm font-medium">
                      🔑 登录
                    </span>
                  </Link>
                  <Link href="/register">
                    <span className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded-full transition-all duration-300 text-sm font-medium shadow-lg">
                      ✨ 注册
                    </span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 分类导航栏 */}
        <div className="border-t border-white/20">
          <div className={`${isMenuOpen ? 'block' : 'hidden'} md:block`}>
            <div className="flex flex-col md:flex-row md:items-center py-2 space-y-2 md:space-y-0 md:space-x-1">
              {categories.map((category) => (
                <Link
                  key={category.slug}
                  href={category.href}
                >
                  <span 
                    className="block px-4 py-2 rounded-lg hover:bg-white/20 transition-all duration-300 text-sm font-medium hover:scale-105 transform"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {category.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* 移动端用户操作 */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-white/20 py-4">
            {isLoading ? (
              <div className="px-4 py-2 text-sm animate-pulse">加载中...</div>
            ) : token ? (
              <div className="space-y-2">
                <Link href="/profile">
                  <span 
                    className="block px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-300 text-sm font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    👤 {user?.username || '个人资料'}
                  </span>
                </Link>
                {user?.role === 'admin' && (
                  <Link href="/admin">
                    <span 
                      className="block px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg transition-all duration-300 text-sm font-medium"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      ⚙️ 管理后台
                    </span>
                  </Link>
                )}
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition-all duration-300 text-sm font-medium"
                >
                  🚪 注销
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Link href="/login">
                  <span 
                    className="block px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-300 text-sm font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    🔑 登录
                  </span>
                </Link>
                <Link href="/register">
                  <span 
                    className="block px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg transition-all duration-300 text-sm font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    ✨ 注册
                  </span>
                </Link>
              </div>
            )}
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;