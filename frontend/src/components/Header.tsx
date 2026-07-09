'use client'; // Header needs to be a client component to use context

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext'; // Import useAuth hook

// 定义导航分类
const categories = [
  { name: '🏠 首页', href: '/', slug: 'home' },
  { name: '💬 大语言模型', href: '/articles?category=test', slug: 'language-models' },
  { name: '🎨 生图模型', href: '/articles?categories=s,thyroid-basics', slug: 'image-generation' },
  { name: '🎬 视频模型', href: '/articles?category=video', slug: 'video-models' },
  { name: '🎵 音频模型', href: '/articles?categories=voice,music', slug: 'audio-models' },
  { name: '🔧 AI硬件', href: '/articles?category=hardware', slug: 'ai-hardware' },
  { name: '⚡ AI工具', href: '/articles?categories=soft,locksoft', slug: 'ai-tools' },
];

const Header: React.FC = () => {
  const { user, token, isLoading, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleLogout = () => {
    logout();
  };

  const isActiveCategory = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }

    const [hrefPath, hrefQuery = ''] = href.split('?');
    if (pathname !== hrefPath) {
      return false;
    }

    if (hrefQuery) {
      const expected = new URLSearchParams(hrefQuery);
      return Array.from(expected.entries()).every(([key, value]) => searchParams.get(key) === value);
    }

    return pathname === href;
  };

  return (
    <header className="border-b border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.82),rgba(236,254,255,0.68),rgba(245,243,255,0.72))] text-slate-800 shadow-[0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur-2xl">
      <nav className="container mx-auto px-4">
        <div className="flex flex-col gap-3 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center justify-between gap-3 lg:flex-shrink-0">
            <Link href="/">
              <span className="flex items-center gap-2 text-xl font-bold transition-colors duration-300">
                <span className="text-3xl">🚀</span>
                <span className="bg-gradient-to-r from-sky-600 via-cyan-500 to-violet-600 bg-clip-text text-transparent">加装AI助手</span>
              </span>
            </Link>

            <button
              className="lg:hidden p-2 rounded-lg border border-white/60 bg-white/45 hover:bg-white/70 transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          <div className={`${isMenuOpen ? 'block' : 'hidden'} lg:block lg:min-w-0 lg:flex-1`}>
            <div className="flex max-w-full flex-col gap-1 overflow-x-auto rounded-2xl border border-white/75 bg-white/48 p-1.5 shadow-[0_12px_34px_rgba(15,23,42,0.07)] backdrop-blur-2xl lg:flex-row lg:items-center lg:justify-center">
              {categories.map((category) => {
                const isActive = isActiveCategory(category.href);

                return (
                  <Link
                    key={category.slug}
                    href={category.href}
                  >
                    <span 
                      className={`block whitespace-nowrap rounded-xl border px-3.5 py-2 text-sm font-medium transition-all duration-300 ${
                        isActive
                          ? 'border-cyan-200/80 bg-white/90 text-sky-700 shadow-md shadow-cyan-500/12'
                          : 'border-transparent text-slate-600 hover:border-white/80 hover:bg-white/75 hover:text-sky-700 hover:shadow-sm hover:shadow-sky-900/5'
                      }`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {category.name}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="hidden lg:flex items-center space-x-3 lg:flex-shrink-0">
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

        {/* 移动端用户操作 */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-white/70 py-4">
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
