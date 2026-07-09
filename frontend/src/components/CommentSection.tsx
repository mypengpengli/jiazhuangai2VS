'use client';

import React, { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Comment } from '@/types/models';

interface CommentSectionProps {
  articleSlug: string;
}

const CommentSection: React.FC<CommentSectionProps> = ({ articleSlug }) => {
  const { token, user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8787';

  useEffect(() => {
    const fetchComments = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`${backendUrl}/api/comments/article/${encodeURIComponent(articleSlug)}`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: '评论加载失败' }));
          throw new Error(errorData.message || '评论加载失败');
        }
        const data = await response.json();
        setComments(data.items || []);
      } catch (err) {
        console.error('Failed to fetch comments:', err);
        setError(err instanceof Error ? err.message : '评论加载失败');
      } finally {
        setIsLoading(false);
      }
    };

    fetchComments();
  }, [articleSlug, backendUrl]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!token) {
      setError('请先登录后再评论。');
      return;
    }

    const trimmedContent = content.trim();
    if (!trimmedContent) {
      setError('评论内容不能为空。');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${backendUrl}/api/comments/article/${encodeURIComponent(articleSlug)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: trimmedContent }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || data?.error || '评论发布失败');
      }

      setComments((current) => [...current, data]);
      setContent('');
    } catch (err) {
      console.error('Failed to submit comment:', err);
      setError(err instanceof Error ? err.message : '评论发布失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="mt-8 rounded-2xl border border-white/80 bg-white/80 p-5 shadow-[0_14px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl md:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-slate-900">评论</h2>
        <span className="rounded-full border border-cyan-100 bg-cyan-50/80 px-3 py-1 text-sm font-medium text-cyan-700">
          {comments.length} 条
        </span>
      </div>

      {token ? (
        <form onSubmit={handleSubmit} className="mb-6 space-y-3">
          <div className="text-sm text-slate-500">
            以 <span className="font-medium text-slate-700">{user?.username || '当前用户'}</span> 身份评论
          </div>
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            maxLength={1000}
            rows={4}
            className="w-full resize-y rounded-xl border border-slate-200 bg-white/85 px-4 py-3 text-sm text-slate-800 shadow-inner outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-100"
            placeholder="写下你的看法..."
            disabled={isSubmitting}
          />
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-slate-400">{content.trim().length}/1000</span>
            <button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 px-5 py-2 text-sm font-medium text-white shadow-lg shadow-cyan-500/20 transition hover:from-cyan-600 hover:to-violet-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? '发布中...' : '发布评论'}
            </button>
          </div>
        </form>
      ) : (
        <div className="mb-6 rounded-xl border border-sky-100 bg-sky-50/70 px-4 py-3 text-sm text-slate-600">
          登录后可以参与评论。
          <Link href="/login" className="ml-2 font-medium text-sky-700 hover:text-sky-900">登录</Link>
          <span className="mx-1 text-slate-300">/</span>
          <Link href="/register" className="font-medium text-sky-700 hover:text-sky-900">注册</Link>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="py-6 text-center text-sm text-slate-500">评论加载中...</div>
      ) : comments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white/60 py-8 text-center text-sm text-slate-500">
          还没有评论。
        </div>
      ) : (
        <ul className="space-y-3">
          {comments.map((comment) => (
            <li key={comment.id} className="rounded-xl border border-slate-100 bg-white/80 p-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium text-slate-800">{comment.username}</span>
                <time className="text-xs text-slate-400">
                  {new Date(comment.created_at).toLocaleString('zh-CN')}
                </time>
              </div>
              <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{comment.content}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default CommentSection;
