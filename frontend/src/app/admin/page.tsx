import Link from 'next/link';
import { BookOpenText, FolderTree, MessageCircleMore, Plus, UsersRound } from 'lucide-react';

const actions = [
  { href: '/admin/articles', label: '管理文章', note: '发布、编辑和整理资讯文章。', icon: BookOpenText },
  { href: '/admin/articles?category=site-experience', label: '维护经验文档', note: '按父级组织多层文档目录。', icon: FolderTree },
  { href: '/admin/comments', label: '审核评论', note: '批准、隐藏或删除用户评论。', icon: MessageCircleMore },
  { href: '/admin/users', label: '管理用户', note: '查看注册用户并控制账号状态。', icon: UsersRound },
];

export default function AdminDashboardPage() {
  return <><div className="flex flex-wrap items-end justify-between gap-4"><div><h2 className="text-2xl font-bold text-slate-950">开始维护网站</h2><p className="mt-2 text-sm text-slate-500">内容、文档、评论和注册用户在这里分别管理。</p></div><Link href="/admin/articles/new" className="inline-flex min-h-10 items-center gap-2 rounded-control bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-700"><Plus className="size-4" />新建文章</Link></div><section className="mt-7 grid gap-3 sm:grid-cols-2">{actions.map(({ href, label, note, icon: Icon }) => <Link key={href} href={href} className="surface-card group flex items-start gap-4 p-5 transition hover:-translate-y-0.5 hover:border-sky-200"><span className="flex size-10 shrink-0 items-center justify-center rounded-control bg-sky-50 text-brand"><Icon className="size-5" /></span><span><span className="block font-bold text-slate-900">{label}</span><span className="mt-1 block text-sm leading-6 text-slate-500">{note}</span></span></Link>)}</section></>;
}
