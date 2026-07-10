'use client';

import Link from 'next/link';
import React, { FormEvent, useEffect, useState } from 'react';
import { MessageCircle, Send } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { formatArticleDateTime } from '@/lib/formatters';
import { Comment } from '@/types/models';

interface CommentSectionProps { articleSlug: string; }

const CommentSection = ({ articleSlug }: CommentSectionProps) => {
  const { token, user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8787';

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${backendUrl}/api/comments/article/${encodeURIComponent(articleSlug)}`);
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.message || '评论加载失败');
        setComments(data.items || []);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : '评论加载失败');
      } finally { setIsLoading(false); }
    };
    void load();
  }, [articleSlug, backendUrl]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const value = content.trim();
    if (!token) { setError('请先登录后再发表评论。'); return; }
    if (!value) { setError('评论内容不能为空。'); return; }
    setIsSubmitting(true); setError(null); setNotice(null);
    try {
      const response = await fetch(`${backendUrl}/api/comments/article/${encodeURIComponent(articleSlug)}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ content: value }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || data.error || '评论发布失败');
      setContent('');
      setNotice('评论已提交，管理员审核后会公开显示。');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '评论发布失败');
    } finally { setIsSubmitting(false); }
  };

  return (
    <section className="surface-card mt-10 p-4 sm:p-6" aria-labelledby="comments-heading">
      <div className="mb-5 flex items-center justify-between"><h2 id="comments-heading" className="flex items-center gap-2 text-lg font-bold text-slate-900"><MessageCircle className="size-5 text-brand" />评论</h2><span className="text-sm text-slate-400">{comments.length} 条已公开</span></div>
      {token ? (
        <form onSubmit={submit} className="mb-6"><p className="mb-2 text-sm text-slate-500">以 <span className="font-medium text-slate-700">{user?.display_name || user?.username}</span> 的身份发表评论</p><textarea value={content} onChange={(event) => setContent(event.target.value)} maxLength={1000} rows={4} disabled={isSubmitting} placeholder="写下你的看法..." className="w-full resize-y rounded-control border border-slate-200 bg-white px-3 py-2.5 text-sm leading-6 text-slate-800 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100" /><div className="mt-2 flex items-center justify-between"><span className="text-xs text-slate-400">{content.trim().length}/1000</span><button type="submit" disabled={isSubmitting || !content.trim()} className="inline-flex min-h-10 items-center gap-2 rounded-control bg-brand px-4 text-sm font-medium text-white transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-50"><Send className="size-4" />{isSubmitting ? '提交中...' : '提交评论'}</button></div></form>
      ) : <div className="mb-6 rounded-control border border-sky-100 bg-sky-50 px-3 py-3 text-sm text-slate-600"><Link href="/login" className="font-medium text-brand-strong hover:underline">登录</Link><span className="mx-1">或</span><Link href="/register" className="font-medium text-brand-strong hover:underline">注册</Link>后可以参与评论。</div>}
      {notice && <p className="mb-4 rounded-control bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</p>}
      {error && <p className="mb-4 rounded-control bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      {isLoading ? <p className="py-5 text-center text-sm text-slate-500">正在加载评论...</p> : comments.length === 0 ? <p className="border-t border-dashed border-slate-200 pt-5 text-center text-sm text-slate-500">还没有公开评论，欢迎留下第一条看法。</p> : <ul className="divide-y divide-slate-100 border-t border-slate-100">{comments.map((comment) => <li key={comment.id} className="py-4"><div className="flex flex-wrap items-center justify-between gap-2"><span className="font-medium text-slate-800">{comment.username}</span><time className="text-xs text-slate-400">{formatArticleDateTime(comment.created_at)}</time></div><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{comment.content}</p></li>)}</ul>}
    </section>
  );
};

export default CommentSection;
