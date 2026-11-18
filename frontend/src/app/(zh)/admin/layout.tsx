'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { BookOpenText, FolderTree, LayoutDashboard, MessageCircleMore, UsersRound } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';

const adminLinks = [
  { href: '/admin', label: '概览', icon: LayoutDashboard },
  { href: '/admin/articles', label: '文章', icon: BookOpenText },
  { href: '/admin/categories', label: '分类', icon: FolderTree },
  { href: '/admin/comments', label: '评论', icon: MessageCircleMore },
  { href: '/admin/users', label: '用户', icon: UsersRound },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <ProtectedRoute requireAdmin><div className="page-shell py-7 sm:py-10"><div className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-medium text-brand">内容运营</p><h1 className="mt-1 text-2xl font-bold text-slate-950">管理后台</h1></div><nav aria-label="后台导航" className="-mx-1 flex max-w-full gap-1 overflow-x-auto px-1 pb-1">{adminLinks.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-control px-3 text-sm font-medium text-slate-600 hover:bg-white hover:text-slate-950"><Icon className="size-4" />{label}</Link>)}</nav></div>{children}</div></ProtectedRoute>;
}
