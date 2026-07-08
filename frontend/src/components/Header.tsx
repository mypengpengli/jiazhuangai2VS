'use client'; // Header needs to be a client component to use context

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext'; // Import useAuth hook

// 定义导航分类
const categories = [
  { name: '🔥 AI新鲜事', href: '/', slug: 'all' },
  { name: '💬 大语言模型', href: '/articles?category=test', slug: 'language-models' },
  { name: '🎨 生图模型', href: '/articles?categories=s,thyroid-basics', slug: 'image-generation' },
  { name: '🎬 视频模型', href: '/articles?category=video', slug: 'video-models' },
  { name: '🎵 音频模型', href: '/articles?categories=voice,music', slug: 'audio-models' },
  { name: '🔧 AI硬件', href: '/articles?category=hardware', slug: 'ai-hardware' },
  { name: '⚡ AI工具', href: '/articles?categories=soft,locksoft', slug: 'ai-tools' },
  { name: '🛠️ 推荐工具', href: '/tools', slug: 'tools' },
  { name: '📖 关于我们', href: '/about', slug: 'about' },
];

const Header: React.FC = () => {
  const { user, token, isLoading, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="border-b border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.82),rgba(236,254,255,0.68),rgba(245,243,255,0.72))] text-slate-800 shadow-[0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur-2xl">
      <nav className="container mx-auto px-4">
        {/* 顶部栏 - Logo和用户操作 */}
        <div className="flex justify-between items-center py-4">
          <Link href="/">
            <span className="text-2xl font-bold transition-colors duration-300 flex items-center gap-2">
              <span className="text-3xl">🚀</span>
              <span className="bg-gradient-to-r from-sky-600 via-cyan-500 to-violet-600 bg-clip-text text-transparent">加装AI助手</span>
            </span>
          </Link>
          
          <div className="flex items-center space-x-2">
            {/* 移动端菜单按钮 */}
            <button
              className="md:hidden p-2 rounded-lg border border-white/60 bg-white/45 hover:bg-white/70 transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* 桌面端用户操作 */}
            <div className="hidden md:flex items-center space-x-3">
              {isLoading ? (
                <div className="px-4 py-2 text-sm animate-pulse">加载中...</div>
              ) : token ? (
                <div className="flex items-center space-x-3">
                  <Link href="/profile">
                    <span className="px-4 py-2 bg-white/55 hover:bg-white/80 border border-sky-200/80 rounded-full transition-all duration-300 text-sm font-medium text-slate-700 shadow-sm shadow-sky-900/5 backdrop-blur-xl">
                      👤 {user?.username || '个人资料'}
                    </span>
                  </Link>
                  {user?.role === 'admin' && (
                    <Link href="/admin">
                      <span className="px-4 py-2 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 rounded-full transition-all duration-300 text-sm font-medium text-white shadow-lg shadow-orange-500/20">
                        ⚙️ 管理后台
                      </span>
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 rounded-full transition-all duration-300 text-sm font-medium text-white shadow-lg shadow-rose-500/20"
                  >
                    🚪 注销
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link href="/login">
                    <span className="px-4 py-2 bg-white/55 hover:bg-white/80 border border-sky-200/80 rounded-full transition-all duration-300 text-sm font-medium text-slate-700 shadow-sm shadow-sky-900/5 backdrop-blur-xl">
                      🔑 登录
                    </span>
                  </Link>
                  <Link href="/register">
                    <span className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 rounded-full transition-all duration-300 text-sm font-medium text-white shadow-lg shadow-cyan-500/20">
                      ✨ 注册
                    </span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 分类导航栏 */}
        <div className="border-t border-white/70">
          <div className={`${isMenuOpen ? 'block' : 'hidden'} md:block`}>
            <div className="flex flex-col md:flex-row md:items-center py-3 space-y-2 md:space-y-0 md:space-x-1 overflow-x-auto">
              {categories.map((category) => (
                <Link
                  key={category.slug}
                  href={category.href}
                >
                  <span 
                    className="block px-4 py-2 rounded-lg border border-transparent text-sm font-medium text-slate-700 transition-all duration-300 hover:scale-105 hover:border-white/70 hover:bg-white/55 hover:text-sky-700 hover:shadow-sm hover:shadow-sky-900/5 transform whitespace-nowrap backdrop-blur-xl"
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
          <div className="md:hidden border-t border-white/70 py-4">
            {isLoading ? (
              <div className="px-4 py-2 text-sm animate-pulse">加载中...</div>
            ) : token ? (
              <div className="space-y-2">
                <Link href="/profile">
                  <span 
                    className="block px-4 py-2 bg-white/55 hover:bg-white/80 rounded-lg transition-all duration-300 text-sm font-medium text-slate-700"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    👤 {user?.username || '个人资料'}
                  </span>
                </Link>
                {user?.role === 'admin' && (
                  <Link href="/admin">
                    <span 
                      className="block px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg transition-all duration-300 text-sm font-medium text-white"
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
                  className="block w-full text-left px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition-all duration-300 text-sm font-medium text-white"
                >
                  🚪 注销
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Link href="/login">
                  <span 
                    className="block px-4 py-2 bg-white/55 hover:bg-white/80 rounded-lg transition-all duration-300 text-sm font-medium text-slate-700"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    🔑 登录
                  </span>
                </Link>
                <Link href="/register">
                  <span 
                    className="block px-4 py-2 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 rounded-lg transition-all duration-300 text-sm font-medium text-white"
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
