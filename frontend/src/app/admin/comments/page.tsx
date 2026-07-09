'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Comment, CommentStatus } from '@/types/models';

const AdminCommentsPage = () => {
  const { token } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8787';

  const fetchComments = async () => {
    if (!token) {
      setError('用户未认证，无法加载评论。');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${backendUrl}/api/comments`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: '获取评论列表失败' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setComments(data.items || []);
    } catch (err) {
      console.error('Failed to fetch comments:', err);
      setError(err instanceof Error ? err.message : '加载评论失败，请稍后重试。');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleStatusChange = async (commentId: number, status: CommentStatus) => {
    if (!token) return;

    try {
      const response = await fetch(`${backendUrl}/api/comments/${commentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      const updatedComment = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(updatedComment?.message || '更新评论状态失败');
      }

      setComments((current) => current.map((comment) => comment.id === commentId ? updatedComment : comment));
    } catch (err) {
      console.error('Failed to update comment:', err);
      alert(err instanceof Error ? err.message : '更新评论状态失败');
    }
  };

  const handleDelete = async (commentId: number) => {
    if (!token || !window.confirm('确定要删除这条评论吗？此操作不可撤销。')) {
      return;
    }

    try {
      const response = await fetch(`${backendUrl}/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: '删除评论失败' }));
        throw new Error(errorData.message || '删除评论失败');
      }

      setComments((current) => current.filter((comment) => comment.id !== commentId));
    } catch (err) {
      console.error('Failed to delete comment:', err);
      alert(err instanceof Error ? err.message : '删除评论失败');
    }
  };

  if (isLoading) {
    return <div className="text-center py-10">加载评论列表中...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">错误: {error}</div>;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">评论管理</h1>
        <button
          onClick={fetchComments}
          className="rounded bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
        >
          刷新
        </button>
      </div>

      {comments.length === 0 ? (
        <p>暂无评论。</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-2 px-4 border-b text-left">ID</th>
                <th className="py-2 px-4 border-b text-left">文章</th>
                <th className="py-2 px-4 border-b text-left">用户</th>
                <th className="py-2 px-4 border-b text-left">评论</th>
                <th className="py-2 px-4 border-b text-left">状态</th>
                <th className="py-2 px-4 border-b text-left">时间</th>
                <th className="py-2 px-4 border-b text-left">操作</th>
              </tr>
            </thead>
            <tbody>
              {comments.map((comment) => (
                <tr key={comment.id} className="hover:bg-gray-50 align-top">
                  <td className="py-2 px-4 border-b">{comment.id}</td>
                  <td className="py-2 px-4 border-b min-w-52">
                    {comment.article_slug ? (
                      <Link href={`/articles/${comment.article_slug}`} target="_blank" className="text-blue-600 hover:underline">
                        {comment.article_title || comment.article_slug}
                      </Link>
                    ) : (
                      comment.article_title || '-'
                    )}
                  </td>
                  <td className="py-2 px-4 border-b">{comment.username}</td>
                  <td className="py-2 px-4 border-b max-w-md">
                    <p className="whitespace-pre-wrap break-words text-sm text-slate-700">{comment.content}</p>
                  </td>
                  <td className="py-2 px-4 border-b">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      comment.status === 'approved'
                        ? 'bg-green-50 text-green-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {comment.status === 'approved' ? '显示中' : '已隐藏'}
                    </span>
                  </td>
                  <td className="py-2 px-4 border-b whitespace-nowrap">
                    {new Date(comment.created_at).toLocaleString('zh-CN')}
                  </td>
                  <td className="py-2 px-4 border-b whitespace-nowrap">
                    {comment.status === 'approved' ? (
                      <button
                        onClick={() => handleStatusChange(comment.id, 'hidden')}
                        className="mr-3 text-slate-600 hover:underline"
                      >
                        隐藏
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStatusChange(comment.id, 'approved')}
                        className="mr-3 text-green-600 hover:underline"
                      >
                        恢复
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(comment.id)}
                      className="text-red-600 hover:underline"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminCommentsPage;
