'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Article } from '@/types/models';

const PAGE_SIZE = 20;

interface ArticleTimelineProps {
  articles: Article[];
}

// 分类图标映射
const getCategoryIcon = (categoryName: string | undefined) => {
  const iconMap: { [key: string]: string } = {
    '各厂语言模型': '💬',
    '大语言模型': '💬',
    '生图模型': '🎨',
    '视频模型': '🎬',
    '音频模型': '🎵',
    'AI硬件': '🔧',
    'AI工具': '⚡',
    'AI开源软件工具': '🔓',
    'AI未开源软件工具': '🔒',
    '本站推荐': '⭐',
  };
  return iconMap[categoryName || ''] || '📄';
};

// 单个文章卡片组件，用 React.memo 避免重复渲染
const ArticleCard = React.memo(({ article }: { article: Article }) => (
  <article
    className="group bg-white rounded-xl border border-gray-100 hover:border-purple-200 shadow-sm hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 overflow-hidden"
  >
    <div className="p-5">
      {/* 分类和时间 */}
      <div className="flex items-center justify-between mb-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-cyan-50 to-purple-50 text-purple-700 rounded-full text-xs font-semibold border border-purple-100">
          {getCategoryIcon(article.category?.name)} {article.category?.name || '未分类'}
        </span>
        <span className="text-xs text-gray-400">
          {new Date(article.display_date || article.created_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {/* 标题 */}
      <h3 className="text-lg font-bold text-gray-800 group-hover:text-purple-700 transition-colors mb-2 line-clamp-2">
        <Link href={`/articles/${article.slug}`}>
          <span className="hover:underline decoration-purple-400 decoration-2 underline-offset-4">
            {article.title}
          </span>
        </Link>
      </h3>

      {/* 摘要 */}
      {article.summary && (
        <p className="text-gray-500 text-sm leading-relaxed mb-4 line-clamp-2">
          {article.summary}
        </p>
      )}

      {/* 阅读更多 */}
      <Link href={`/articles/${article.slug}`}>
        <span className="inline-flex items-center gap-2 text-sm text-purple-600 hover:text-purple-800 font-medium transition-all duration-300 group-hover:gap-3">
          阅读详情
          <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
          </svg>
        </span>
      </Link>
    </div>

    {/* 底部装饰条 */}
    <div className="h-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
  </article>
));
ArticleCard.displayName = 'ArticleCard';

const ArticleTimeline: React.FC<ArticleTimelineProps> = ({ articles }) => {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const loaderRef = useRef<HTMLDivElement>(null);

  // 当 articles 变化时（比如切换分类），重置可见数量
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [articles]);

  const hasMore = visibleCount < articles.length;

  const loadMore = useCallback(() => {
    setVisibleCount(prev => Math.min(prev + PAGE_SIZE, articles.length));
  }, [articles.length]);

  // IntersectionObserver 实现无限滚动
  useEffect(() => {
    if (!hasMore || !loaderRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  // 只对可见的文章进行分组
  const { sortedDates, groupedByDate } = useMemo(() => {
    const visible = articles.slice(0, visibleCount);
    const grouped: { [date: string]: Article[] } = {};
    visible.forEach(article => {
      const date = new Date(article.display_date || article.created_at);
      const dateKey = date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(article);
    });

    const sorted = Object.keys(grouped).sort((a, b) => {
      const dateA = new Date(grouped[a][0].display_date || grouped[a][0].created_at);
      const dateB = new Date(grouped[b][0].display_date || grouped[b][0].created_at);
      return dateB.getTime() - dateA.getTime();
    });

    return { sortedDates: sorted, groupedByDate: grouped };
  }, [articles, visibleCount]);

  if (!articles || articles.length === 0) {
    return <p className="text-center text-gray-600">暂无文章可显示。</p>;
  }

  return (
    <div className="space-y-8">
      {sortedDates.map((dateKey) => (
        <div key={dateKey} className="relative">
          {/* 日期标签 */}
          <div className="sticky top-4 z-10 mb-4">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white text-sm font-semibold rounded-full shadow-lg shadow-purple-500/20">
              📅 {dateKey}
            </span>
          </div>

          {/* 文章卡片网格 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {groupedByDate[dateKey].map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </div>
      ))}

      {/* 加载更多触发器 */}
      {hasMore && (
        <div ref={loaderRef} className="flex justify-center py-8">
          <div className="inline-flex items-center gap-2 text-gray-400 text-sm">
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            加载更多...
          </div>
        </div>
      )}

      {/* 到底提示 */}
      {!hasMore && articles.length > PAGE_SIZE && (
        <div className="text-center py-6 text-gray-400 text-sm">
          — 已显示全部 {articles.length} 篇文章 —
        </div>
      )}
    </div>
  );
};

export default ArticleTimeline;
