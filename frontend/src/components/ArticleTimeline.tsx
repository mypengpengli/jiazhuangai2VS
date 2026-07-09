'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { Article } from '@/types/models';

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
    '本站经验分享': '📘',
  };
  return iconMap[categoryName || ''] || '📄';
};

// 单个文章卡片组件，用 React.memo 避免重复渲染
const ArticleCard = React.memo(({ article }: { article: Article }) => (
  <article
    className="group bg-white/88 rounded-xl border border-white/80 shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur-xl hover:border-sky-200/90 hover:shadow-xl hover:shadow-sky-500/12 hover:-translate-y-1 transition-all duration-300 overflow-hidden"
  >
    <div className="p-5">
      {/* 分类和时间 */}
      <div className="flex items-center justify-between mb-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/60 text-sky-700 rounded-full text-xs font-semibold border border-sky-100">
          {getCategoryIcon(article.category?.name)} {article.category?.name || '未分类'}
        </span>
        <span className="inline-flex items-center gap-2 text-xs text-gray-400">
          {typeof article.view_count === 'number' && article.view_count > 0 && (
            <span className="inline-flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {article.view_count.toLocaleString()}
            </span>
          )}
          {new Date(article.display_date || article.created_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {/* 标题 */}
      <h3 className="text-lg font-bold text-slate-800 group-hover:text-sky-700 transition-colors mb-2 line-clamp-2">
        <Link href={`/articles/${article.slug}`}>
          <span className="hover:underline decoration-sky-400 decoration-2 underline-offset-4">
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
        <span className="inline-flex items-center gap-2 text-sm text-sky-600 hover:text-sky-800 font-medium transition-all duration-300 group-hover:gap-3">
          阅读详情
          <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
          </svg>
        </span>
      </Link>
    </div>

    {/* 底部装饰条 */}
    <div className="h-1 bg-gradient-to-r from-cyan-400 via-sky-500 to-violet-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
  </article>
));
ArticleCard.displayName = 'ArticleCard';

const ArticleTimeline: React.FC<ArticleTimelineProps> = ({ articles }) => {
  const { sortedDates, groupedByDate } = useMemo(() => {
    const grouped: { [date: string]: Article[] } = {};
    articles.forEach(article => {
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
  }, [articles]);

  if (!articles || articles.length === 0) {
    return <p className="text-center text-gray-600">暂无文章可显示。</p>;
  }

  return (
    <div className="space-y-5">
      {sortedDates.map((dateKey) => (
        <div key={dateKey} className="relative">
          {/* 日期标签 */}
          <div className="sticky top-4 z-10 mb-2">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-cyan-500 to-purple-500 text-white text-sm font-semibold rounded-full shadow-lg shadow-purple-500/20">
              📅 {dateKey}
            </span>
          </div>

          {/* 文章卡片网格 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {groupedByDate[dateKey].map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ArticleTimeline;
