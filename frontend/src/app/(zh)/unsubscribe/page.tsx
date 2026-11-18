'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const token = searchParams.get('token') || '';

  const unsubscribe = async () => {
    if (!token) { setStatus('error'); setMessage('退订链接无效或已失效。'); return; }
    setStatus('loading');
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8787';
    try {
      const response = await fetch(`${backendUrl}/api/subscribe/unsubscribe`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || '退订失败');
      setStatus('success'); setMessage(data.message || '你已成功取消订阅。');
    } catch (error) { setStatus('error'); setMessage(error instanceof Error ? error.message : '退订失败'); }
  };

  return <div className="page-shell flex min-h-[55vh] items-center justify-center py-10"><section className="surface-card w-full max-w-md p-6 text-center"><h1 className="text-2xl font-bold text-slate-900">取消邮件订阅</h1><p className="mt-3 text-sm leading-6 text-slate-500">确认后将不再收到加装AI助手的订阅邮件，之后仍可随时重新订阅。</p>{message && <p className={`mt-5 rounded-control px-3 py-2 text-sm ${status === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{message}</p>}{status !== 'success' && <button type="button" disabled={status === 'loading'} onClick={unsubscribe} className="mt-6 min-h-11 rounded-control bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50">{status === 'loading' ? '正在处理...' : '确认取消订阅'}</button>}<Link href="/" className="mt-5 block text-sm font-medium text-brand hover:underline">返回首页</Link></section></div>;
}

export default function UnsubscribePage() {
  return <Suspense fallback={<div className="page-shell flex min-h-[55vh] items-center justify-center text-sm text-slate-500">正在加载退订页面...</div>}><UnsubscribeContent /></Suspense>;
}
