'use client';

import React, { useState, useEffect } from 'react';
import { Article } from '@/types/models';

const VIPPage = () => {
  const [article, setArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVipArticle = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8787';
        const response = await fetch(`${backendUrl}/api/articles/vip`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: '获取VIP文章失败' }));
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        
        const data: Article = await response.json();
        setArticle(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载文章时发生未知错误');
      } finally {
        setIsLoading(false);
      }
    };

    fetchVipArticle();
  }, []);


  if (isLoading) {
    return <div className="container mx-auto px-4 py-8 text-center">正在加载 VIP 文章...</div>;
  }

  if (error) {
    return <div className="container mx-auto px-4 py-8 text-center text-red-500">错误: {error}</div>;
  }

  if (!article) {
    return <div className="container mx-auto px-4 py-8 text-center">未能加载文章。</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <article className="prose lg:prose-xl max-w-none">
        <h1 className="text-3xl font-bold mb-4">{article.title}</h1>
        {article.display_date && (
            <div className="text-gray-600 mb-8">
              发布于 {new Date(article.display_date).toLocaleDateString()}
            </div>
        )}
        {/* 使用 dangerouslySetInnerHTML 来渲染 HTML 内容 */}
        <div dangerouslySetInnerHTML={{ __html: article.content || '' }} />
      </article>
    </div>
  );
};

export default VIPPage;