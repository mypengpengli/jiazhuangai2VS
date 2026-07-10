'use client';

import { FormEvent, useEffect, useState } from 'react';

const apiBase = process.env.NEXT_PUBLIC_BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://api.jiazhuangai.com';

export default function SubscribeForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  useEffect(() => { if (status === 'idle') return; const timeout = window.setTimeout(() => { setStatus('idle'); setMessage(''); }, 5000); return () => window.clearTimeout(timeout); }, [status]);
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setStatus('error'); setMessage('请输入有效的邮箱地址。'); return; } setStatus('loading'); try { const response = await fetch(`${apiBase}/api/subscribe`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) }); const data = await response.json().catch(() => null); if (!response.ok) throw new Error(data?.error || '订阅失败'); setEmail(''); setStatus('success'); setMessage(data?.message || '订阅请求已提交。'); } catch (error) { setStatus('error'); setMessage(error instanceof Error ? error.message : '网络错误，请稍后重试。'); } };
  return <div className="mt-5"><p className="text-sm font-medium text-slate-100">订阅 AI 资讯</p><form onSubmit={submit} className="mt-2 flex gap-2"><label className="sr-only" htmlFor="footer-email">邮箱地址</label><input id="footer-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="输入邮箱" disabled={status === 'loading'} className="min-w-0 flex-1 rounded-control border border-slate-600 bg-slate-800 px-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-sky-300 disabled:opacity-50" /><button type="submit" disabled={status === 'loading'} className="h-10 shrink-0 rounded-control bg-sky-400 px-3 text-sm font-medium text-slate-950 hover:bg-sky-300 disabled:opacity-50">{status === 'loading' ? '提交中' : '订阅'}</button></form>{message && <p role="status" className={`mt-2 text-xs ${status === 'success' ? 'text-emerald-300' : 'text-rose-300'}`}>{message}</p>}</div>;
}
