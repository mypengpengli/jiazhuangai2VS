'use client';

import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError(null);
    if (password.length < 8) { setError('密码至少需要 8 个字符。'); return; }
    if (password !== confirmPassword) { setError('两次输入的密码不一致。'); return; }
    setLoading(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8787';
      const response = await fetch(`${backendUrl}/api/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.token) throw new Error(data.error || data.message || '注册失败');
      login(data.token); router.replace('/profile');
    } catch (cause) { setError(cause instanceof Error ? cause.message : '注册失败'); }
    finally { setLoading(false); }
  };

  return <div className="page-shell flex min-h-[calc(100vh-11rem)] items-center justify-center py-8"><section className="surface-card w-full max-w-md p-6 sm:p-8"><div className="flex size-11 items-center justify-center rounded-control bg-violet-50 text-accent"><Sparkles className="size-5" /></div><h1 className="mt-5 text-2xl font-bold text-slate-950">注册账户</h1><p className="mt-2 text-sm leading-6 text-slate-500">注册后可以维护显示昵称，并在文章下发表待审核评论。</p><form onSubmit={submit} className="mt-6 grid gap-4"><label className="grid gap-2 text-sm font-medium text-slate-700">用户名<input type="text" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" minLength={2} maxLength={40} required className="min-h-11 rounded-control border border-slate-200 px-3 text-slate-900 outline-none focus:border-sky-300 focus:ring-4 focus:ring-sky-100" /></label><label className="grid gap-2 text-sm font-medium text-slate-700">密码<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" minLength={8} required className="min-h-11 rounded-control border border-slate-200 px-3 text-slate-900 outline-none focus:border-sky-300 focus:ring-4 focus:ring-sky-100" /></label><label className="grid gap-2 text-sm font-medium text-slate-700">确认密码<input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" minLength={8} required className="min-h-11 rounded-control border border-slate-200 px-3 text-slate-900 outline-none focus:border-sky-300 focus:ring-4 focus:ring-sky-100" /></label>{error && <p className="rounded-control bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}<button type="submit" disabled={loading} className="mt-1 min-h-11 rounded-control bg-brand text-sm font-medium text-white transition hover:bg-brand-strong disabled:opacity-50">{loading ? '正在注册...' : '注册并登录'}</button></form><p className="mt-5 text-sm text-slate-500">已有账户？<Link href="/login" className="font-medium text-brand hover:underline">前往登录</Link></p></section></div>;
}
