'use client';

import * as Dialog from '@radix-ui/react-dialog';
import Link from 'next/link';
import { Languages, LogIn, LogOut, Menu, Rocket, Settings, Sparkles, UserRound, X } from 'lucide-react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { primaryNavigation } from '@/lib/navigation';
import { localizedPath, type Locale } from '@/lib/locale';
import LanguageLink from './LanguageLink';

const Header = ({ locale }: { locale: Locale }) => {
  const { isLoading, logout, token, user } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isMounted, setIsMounted] = useState(false);
  const isEnglish = locale === 'en';
  const displayName = user?.display_name || user?.username || (isEnglish ? 'Profile' : '个人资料');
  const home = localizedPath('/', locale);
  const otherLocale = isEnglish ? 'zh-CN' : 'en';
  const currentPath = isEnglish ? pathname.slice(3) || '/' : pathname;
  const listPath = currentPath === '/articles' ? `/articles${searchParams.size ? `?${searchParams}` : ''}` : '/';
  const switchHref = localizedPath(
    ['/experience', '/about', '/privacy', '/terms', '/login', '/register', '/profile'].includes(currentPath) ? currentPath : listPath,
    otherLocale
  );

  useEffect(() => { setIsMounted(true); }, []);

  const isActive = (href: string) => {
    if (href === home) return pathname === home;
    const [path, query] = href.split('?');
    if (pathname !== path) return false;
    if (!query) return true;
    return Array.from(new URLSearchParams(query)).every(([key, value]) => searchParams.get(key) === value);
  };

  const accountLinks = (mobile = false) => {
    const itemClass = mobile
      ? 'flex min-h-11 items-center gap-3 rounded-control px-3 text-sm font-medium text-slate-700 transition hover:bg-sky-50 hover:text-sky-800'
      : 'inline-flex min-h-10 items-center gap-2 rounded-control border border-sky-200 bg-white/75 px-3 text-sm font-medium text-slate-700 transition hover:border-sky-300 hover:bg-white';

    if (!isMounted || isLoading) {
      return <span className="px-3 text-sm text-slate-400">{isEnglish ? 'Loading account...' : '正在读取账户...'}</span>;
    }

    if (!token) {
      return (
        <>
          <Link href={localizedPath('/login', locale)} className={itemClass}><LogIn className="size-4" />{isEnglish ? 'Log in' : '登录'}</Link>
          <Link href={localizedPath('/register', locale)} className={`${mobile ? itemClass : 'inline-flex min-h-10 items-center gap-2 rounded-control bg-brand px-3 text-sm font-medium text-white shadow-sm transition hover:bg-brand-strong'}`}>
            <Sparkles className="size-4" />{isEnglish ? 'Sign up' : '注册'}
          </Link>
        </>
      );
    }

    return (
      <>
        <Link href={localizedPath('/profile', locale)} className={itemClass}><UserRound className="size-4" />{displayName}</Link>
        {user?.role === 'admin' && (
          <Link href="/admin" className={mobile ? itemClass : 'inline-flex min-h-10 items-center gap-2 rounded-control bg-amber-500 px-3 text-sm font-medium text-white shadow-sm transition hover:bg-amber-600'}>
            <Settings className="size-4" />{isEnglish ? 'Admin' : '管理后台'}
          </Link>
        )}
        <button type="button" onClick={logout} className={mobile ? itemClass : 'inline-flex min-h-10 items-center gap-2 rounded-control border border-rose-200 bg-rose-50 px-3 text-sm font-medium text-rose-700 transition hover:bg-rose-100'}>
          <LogOut className="size-4" />{isEnglish ? 'Log out' : '退出'}
        </button>
      </>
    );
  };

  const navLinks = (mobile = false) => (
    <div className={mobile ? 'grid gap-1' : 'flex min-w-0 items-center justify-center gap-1'}>
      {primaryNavigation.map(({ href: baseHref, icon: Icon, label, en }) => {
        const href = localizedPath(baseHref, locale);
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={mobile
              ? `flex min-h-11 items-center gap-3 rounded-control px-3 text-sm font-medium transition ${active ? 'bg-sky-50 text-sky-800 ring-1 ring-sky-200' : 'text-slate-700 hover:bg-slate-50 hover:text-sky-800'}`
              : `inline-flex h-10 items-center gap-1.5 rounded-control px-2.5 text-sm font-medium transition ${active ? 'bg-white text-brand-strong shadow-sm ring-1 ring-sky-200' : 'text-slate-600 hover:bg-white/80 hover:text-brand-strong'}`}
          >
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            <span className="whitespace-nowrap">{isEnglish ? en : label}</span>
          </Link>
        );
      })}
    </div>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-white/80 bg-white/78 shadow-[0_6px_24px_rgb(15_23_42_/_0.06)] backdrop-blur-xl">
      <nav className="page-shell flex min-h-16 items-center gap-3 py-2" aria-label={isEnglish ? 'Main navigation' : '主导航'}>
        <Link href={home} className="inline-flex shrink-0 items-center gap-2 text-lg font-bold text-slate-900" aria-label={isEnglish ? 'Jiazhuang AI home' : '加装AI助手首页'}>
          <span className="flex size-9 items-center justify-center rounded-control bg-sky-50 text-brand"><Rocket className="size-5" /></span>
          <span>{isEnglish ? <>Jiazhuang <span className="text-brand">AI</span></> : <>加装<span className="text-brand">AI</span>助手</>}</span>
        </Link>

        <div className="glass-surface hidden min-w-0 flex-1 px-1.5 py-1 xl:block">
          {navLinks()}
        </div>

        <div className="ml-auto hidden shrink-0 items-center gap-2 xl:flex">
          {accountLinks()}
        </div>

        <LanguageLink locale={otherLocale} href={switchHref} lang={otherLocale} className="ml-auto inline-flex h-10 shrink-0 items-center gap-1 rounded-control border border-slate-200 bg-white px-2 text-sm font-medium text-slate-700 hover:border-sky-300 xl:ml-0">
          <Languages className="size-4" aria-hidden />{isEnglish ? '中文' : 'EN'}
        </LanguageLink>
        <Dialog.Root>
          <Dialog.Trigger asChild>
            <button type="button" className="inline-flex size-11 items-center justify-center rounded-control border border-slate-200 bg-white text-slate-800 shadow-sm xl:hidden" aria-label={isEnglish ? 'Open menu' : '打开导航菜单'}>
              <Menu className="size-5" />
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/25 backdrop-blur-sm" />
            <Dialog.Content className="fixed inset-x-3 top-3 z-50 max-h-[calc(100vh-1.5rem)] overflow-y-auto rounded-panel border border-white/80 bg-white p-3 shadow-raised sm:left-auto sm:right-4 sm:w-96">
              <div className="mb-3 flex items-center justify-between">
                <Dialog.Title className="text-base font-semibold text-slate-900">{isEnglish ? 'Navigation' : '导航'}</Dialog.Title>
                <Dialog.Close asChild>
                  <button type="button" className="inline-flex size-10 items-center justify-center rounded-control text-slate-600 transition hover:bg-slate-100" aria-label={isEnglish ? 'Close menu' : '关闭导航菜单'}><X className="size-5" /></button>
                </Dialog.Close>
              </div>
              <Dialog.Close asChild><div>{navLinks(true)}</div></Dialog.Close>
              <div className="my-3 border-t border-slate-200" />
              <Dialog.Close asChild><div className="grid gap-1">{accountLinks(true)}</div></Dialog.Close>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </nav>
    </header>
  );
};

export default Header;
