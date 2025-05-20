'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Article } from '@/types/models'; // 假设类型已定义
import { useAuth } from '@/context/AuthContext'; // 用于获取 token

const AdminArticlesPage = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth(); // 获取 token 用于 API 请求

  useEffect(() => {
    const fetchArticles = async () => {
      if (!token) {
        setError('用户未认证，无法加载文章。');
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8787';
        // 明确按 display_date 降序排序
        const response = await fetch(`${backendUrl}/api/articles?limit=100&sortBy=display_date&orderDirection=desc`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: '获取文章列表失败' }));
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setArticles(data.items || []); // API 返回的数据结构是 { items: [], ... }
      } catch (err: unknown) {
        console.error('Failed to fetch articles:', err);
        if (err instanceof Error) {
          setError(err.message || '加载文章失败，请稍后重试。');
        } else {
          setError('加载文章失败: 发生未知错误。');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchArticles();
  }, [token]);

  const handleDeleteArticle = async (articleId: number) => {
    if (!token) {
        alert('认证无效，无法删除。');
        return;
    }
    if (window.confirm('确定要删除这篇文章吗？此操作不可撤销。')) {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8787';
        const response = await fetch(`${backendUrl}/api/articles/${articleId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: '删除失败' }));
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        // 重新加载文章列表
        setArticles(prevArticles => prevArticles.filter(article => article.id !== articleId));
        alert('文章删除成功！');
      } catch (err: unknown) {
        console.error('Failed to delete article:', err);
        if (err instanceof Error) {
          alert(`删除文章失败: ${err.message}`);
        } else {
          alert('删除文章失败: 发生未知错误。');
        }
      }
    }
  };

  if (isLoading) {
    return <div className="text-center py-10">加载文章列表中...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">错误: {error}</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">文章管理</h1>
        <Link href="/admin/articles/new" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          创建新文章
        </Link>
      </div>

      {articles.length === 0 ? (
        <p>暂无文章。</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-2 px-4 border-b text-left">ID</th>
                <th className="py-2 px-4 border-b text-left">标题</th>
                <th className="py-2 px-4 border-b text-left">分类</th>
                <th className="py-2 px-4 border-b text-left">显示日期</th>
                <th className="py-2 px-4 border-b text-left">创建日期</th>
                <th className="py-2 px-4 border-b text-left">操作</th>
              </tr>
            </thead>
            <tbody>
              {articles.map((article) => (
                <tr key={article.id} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border-b">{article.id}</td>
                  <td className="py-2 px-4 border-b">
                    <Link href={`/articles/${article.slug}`} target="_blank" className="text-blue-600 hover:underline">
                        {article.title}
                    </Link>
                  </td>
                  <td className="py-2 px-4 border-b">{article.category?.name || '未分类'}</td>
                  <td className="py-2 px-4 border-b">{article.display_date ? new Date(article.display_date).toLocaleDateString() : '未设置'}</td>
                  <td className="py-2 px-4 border-b">{new Date(article.created_at).toLocaleDateString()}</td>
                  <td className="py-2 px-4 border-b">
                    <Link href={`/admin/articles/edit/${article.slug}`} className="text-yellow-600 hover:underline mr-2">
                      编辑
                    </Link>
                    <button
                      onClick={() => handleDeleteArticle(article.id)}
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

export default AdminArticlesPage;