'use client';

import { useState, useEffect } from 'react';
import { Article } from '@/types/models'; // 假设你的文章类型定义在这里
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const VIPPage = () => {
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVipArticle = async () => {
      try {
        setLoading(true);
        // 注意：这里的 URL 是相对于你的 Next.js 应用的，Next.js 会代理到你在 next.config.js 中设置的后端地址
        const response = await fetch('/api/articles/vip');
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('未能找到指定的VIP文章。');
          } else {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
        } else {
          const data: Article = await response.json();
          setArticle(data);
        }
      } catch (e: any) {
        console.error('获取VIP文章失败:', e);
        setError(e.message || '获取文章时发生未知错误。');
      } finally {
        setLoading(false);
      }
    };

    fetchVipArticle();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        {loading && (
          <div className="p-8 text-center text-gray-500">正在加载文章...</div>
        )}
        {error && (
          <div className="p-8 text-center text-red-500 bg-red-100 border border-red-400 rounded">
            <h2 className="text-xl font-bold mb-2">加载出错</h2>
            <p>{error}</p>
          </div>
        )}
        {article && (
          <article className="prose lg:prose-xl max-w-none p-6 md:p-8">
             <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 leading-tight">{article.title}</h1>
             <div className="mb-6 text-sm text-gray-500">
                <span>分类: {article.category?.name || '未分类'}</span>
                <span className="mx-2">|</span>
                <span>发布日期: {new Date(article.display_date || article.created_at).toLocaleDateString()}</span>
             </div>
             <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {article.content || ''}
             </ReactMarkdown>
          </article>
        )}
      </div>
    </div>
  );
};

export default VIPPage; 