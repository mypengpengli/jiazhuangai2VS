'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Article } from '@/types/models'; // 假设类型已定义
import { useAuth } from '@/context/AuthContext'; // 用于获取 token

const PAGE_SIZE = 50;

const AdminArticlesPage = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const { token } = useAuth(); // 获取 token 用于 API 请求
  const searchParams = useSearchParams();
  const categoryFilter = searchParams.get('category') || '';
  const isExperienceFilter = categoryFilter === 'site-experience';

  const fetchArticles = async (page = 1, append = false) => {
      if (!token) {
        setError('用户未认证，无法加载文章。');
        setIsLoading(false);
        return;
      }
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }
      setError(null);
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8787';
        const params = new URLSearchParams({
          limit: String(PAGE_SIZE),
          page: String(page),
          sortBy: 'display_date',
          orderDirection: 'desc',
        });
        if (categoryFilter) {
          params.set('category', categoryFilter);
        }

        const response = await fetch(`${backendUrl}/api/articles?${params.toString()}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: '获取文章列表失败' }));
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setArticles((current) => append ? [...current, ...(data.items || [])] : (data.items || []));
        setCurrentPage(data.current_page || page);
        setTotalPages(data.total_pages || 1);
        setTotalItems(data.total_items || (data.items || []).length);
      } catch (err: unknown) {
        console.error('Failed to fetch articles:', err);
        if (err instanceof Error) {
          setError(err.message || '加载文章失败，请稍后重试。');
        } else {
          setError('加载文章失败: 发生未知错误。');
        }
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    };

  useEffect(() => {
    fetchArticles(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, categoryFilter]);

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
        <div>
          <h1 className="text-3xl font-bold">{isExperienceFilter ? '本站经验分享' : '文章管理'}</h1>
          <p className="mt-1 text-sm text-gray-500">已加载 {articles.length} / {totalItems || articles.length} 篇</p>
        </div>
        <Link href={isExperienceFilter ? '/admin/articles/new?category=site-experience' : '/admin/articles/new'} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          {isExperienceFilter ? '新建经验文章' : '创建新文章'}
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
                    {article.slug ? (
                        <Link href={`/articles/${article.slug}`} target="_blank" className="text-blue-600 hover:underline">
                            {article.title}
                        </Link>
                    ) : (
                        <span className="text-gray-500" title="这篇文章缺少 SLUG，无法生成访问链接。请编辑并添加。">
                            {article.title}
                        </span>
                    )}
                  </td>
                  <td className="py-2 px-4 border-b">{article.category?.name || '未分类'}</td>
                  <td className="py-2 px-4 border-b">{article.display_date ? new Date(article.display_date).toLocaleDateString() : '未设置'}</td>
                  <td className="py-2 px-4 border-b">{new Date(article.created_at).toLocaleDateString()}</td>
                  <td className="py-2 px-4 border-b">
                     {article.slug ? (
                        <Link href={`/admin/articles/edit/${article.slug}`} className="text-yellow-600 hover:underline mr-2">
                            编辑
                        </Link>
                     ) : (
                        <span className="text-gray-400 cursor-not-allowed mr-2" title="无法编辑，因为缺少 SLUG。">
                            编辑
                        </span>
                     )}
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

      {currentPage < totalPages && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => fetchArticles(currentPage + 1, true)}
            disabled={isLoadingMore}
            className="rounded bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 disabled:opacity-50"
          >
            {isLoadingMore ? '加载中...' : '加载更多'}
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminArticlesPage;
