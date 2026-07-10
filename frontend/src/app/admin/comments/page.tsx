'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Check, EyeOff, LoaderCircle, RefreshCw, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Comment, CommentStatus } from '@/types/models';
import { formatArticleDateTime } from '@/lib/formatters';

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8787';
const labels: Record<CommentStatus, string> = { pending: '待审核', approved: '已公开', hidden: '已隐藏' };

export default function AdminCommentsPage() {
  const { token } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [status, setStatus] = useState<CommentStatus | 'all'>('pending');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const visible = useMemo(() => status === 'all' ? comments : comments.filter((comment) => comment.status === status), [comments, status]);

  const fetchComments = useCallback(async () => {
    if (!token) return;
    setIsLoading(true); setError(null);
    try { const response = await fetch(`${backendUrl}/api/comments`, { headers: { Authorization: `Bearer ${token}` } }); const data = await response.json().catch(() => null); if (!response.ok) throw new Error(data?.error || '获取评论列表失败'); setComments(data.items || []); }
    catch (reason) { setError(reason instanceof Error ? reason.message : '获取评论列表失败'); }
    finally { setIsLoading(false); }
  }, [token]);
  useEffect(() => { void fetchComments(); }, [fetchComments]);
  const update = async (commentId: number, nextStatus: CommentStatus) => {
    if (!token) return; setBusyId(commentId);
    try { const response = await fetch(`${backendUrl}/api/comments/${commentId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ status: nextStatus }) }); const data = await response.json().catch(() => null); if (!response.ok) throw new Error(data?.error || '更新评论失败'); setComments((current) => current.map((comment) => comment.id === commentId ? data : comment)); }
    catch (reason) { setError(reason instanceof Error ? reason.message : '更新评论失败'); }
    finally { setBusyId(null); }
  };
  const remove = async (commentId: number) => {
    if (!token || !window.confirm('确定永久删除这条评论？此操作不可恢复。')) return; setBusyId(commentId);
    try { const response = await fetch(`${backendUrl}/api/comments/${commentId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }); if (!response.ok) throw new Error('删除评论失败'); setComments((current) => current.filter((comment) => comment.id !== commentId)); }
    catch (reason) { setError(reason instanceof Error ? reason.message : '删除评论失败'); }
    finally { setBusyId(null); }
  };
  return <section><div className="flex flex-wrap items-end justify-between gap-4"><div><h2 className="text-2xl font-bold text-slate-950">评论审核</h2><p className="mt-2 text-sm text-slate-500">新评论默认待审核，只有批准后才会在文章下显示。</p></div><button type="button" onClick={() => void fetchComments()} className="inline-flex min-h-10 items-center gap-2 rounded-control border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 hover:bg-slate-50"><RefreshCw className="size-4" />刷新</button></div>{error && <p role="alert" className="mt-4 rounded-control border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}<div className="mt-6 flex gap-2 overflow-x-auto pb-1">{(['pending', 'approved', 'hidden', 'all'] as const).map((item) => <button key={item} type="button" onClick={() => setStatus(item)} className={`h-9 shrink-0 rounded-control px-3 text-sm font-medium ${status === item ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>{item === 'all' ? `全部 ${comments.length}` : `${labels[item]} ${comments.filter((comment) => comment.status === item).length}`}</button>)}</div><div className="surface-card mt-4 overflow-hidden">{isLoading ? <div className="flex min-h-48 items-center justify-center gap-2 text-sm text-slate-500"><LoaderCircle className="size-4 animate-spin" />正在加载评论...</div> : visible.length === 0 ? <p className="py-14 text-center text-sm text-slate-500">当前没有{status === 'all' ? '' : labels[status]}评论。</p> : <ul className="divide-y divide-slate-100">{visible.map((comment) => <li key={comment.id} className="p-4 sm:p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm"><strong className="text-slate-900">{comment.username}</strong><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${comment.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : comment.status === 'pending' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{labels[comment.status]}</span><time className="text-xs text-slate-400">{formatArticleDateTime(comment.created_at)}</time></div><Link href={`/articles/${comment.article_slug}`} target="_blank" className="mt-1 inline-block text-sm text-brand hover:underline">{comment.article_title || comment.article_slug || '查看文章'}</Link></div><div className="flex items-center gap-1">{comment.status !== 'approved' && <button disabled={busyId === comment.id} type="button" onClick={() => void update(comment.id, 'approved')} className="inline-flex size-9 items-center justify-center rounded-control text-emerald-700 hover:bg-emerald-50" title="批准公开"><Check className="size-4" /></button>}{comment.status !== 'hidden' && <button disabled={busyId === comment.id} type="button" onClick={() => void update(comment.id, 'hidden')} className="inline-flex size-9 items-center justify-center rounded-control text-slate-600 hover:bg-slate-100" title="隐藏"><EyeOff className="size-4" /></button>}<button disabled={busyId === comment.id} type="button" onClick={() => void remove(comment.id)} className="inline-flex size-9 items-center justify-center rounded-control text-rose-700 hover:bg-rose-50" title="删除"><Trash2 className="size-4" /></button></div></div><p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{comment.content}</p></li>)}</ul>}</div></section>;
}
