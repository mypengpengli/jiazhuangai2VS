'use client';

import Link from 'next/link';
import { ArrowRight, Eye, FileText, Image as ImageIcon, MessageSquareText, Music2, PlaySquare, Wrench } from 'lucide-react';
import React, { useMemo } from 'react';
import { Article } from '@/types/models';
import { formatArticleDate, formatArticleTime, formatNumber } from '@/lib/formatters';
import { resolveMediaUrl } from '@/lib/media';

interface ArticleTimelineProps {
  articles: Article[];
}

const categoryIcon = (categoryName?: string) => {
  const name = categoryName || '';
  if (name.includes('语言')) return MessageSquareText;
  if (name.includes('生图') || name.includes('图像')) return ImageIcon;
  if (name.includes('视频')) return PlaySquare;
  if (name.includes('音频') || name.includes('语音')) return Music2;
  if (name.includes('硬件') || name.includes('工具')) return Wrench;
  return FileText;
};

const ArticleCard = React.memo(({ article }: { article: Article }) => {
  const Icon = categoryIcon(article.category?.name);
  const imageUrl = resolveMediaUrl(article.cover_image);
  const date = article.display_date || article.created_at;

  return (
    <article className="group surface-card flex min-h-36 overflow-hidden transition duration-200 hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-float">
      {imageUrl ? (
        <img src={imageUrl} alt="" className="hidden h-auto w-32 shrink-0 object-cover sm:block" loading="lazy" />
      ) : (
        <div className="hidden w-1.5 shrink-0 bg-sky-400 sm:block" aria-hidden="true" />
      )}
      <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="inline-flex min-w-0 items-center gap-1.5 font-medium text-brand-strong"><Icon className="size-3.5 shrink-0" /><span className="truncate">{article.category?.name || '未分类'}</span></span>
          <span className="shrink-0 text-slate-400">{formatArticleTime(date)}</span>
        </div>
        <h3 className="mt-2 text-[1.02rem] font-semibold leading-6 text-slate-900 transition group-hover:text-brand-strong">
          <Link href={`/articles/${article.slug}`} className="outline-none">{article.title}</Link>
        </h3>
        <div className="mt-auto flex min-h-9 items-end justify-between gap-3 pt-3 text-xs text-slate-400">
          <span className="inline-flex items-center gap-1"><Eye className="size-3.5" />{formatNumber(article.view_count)} 次阅读</span>
          <Link href={`/articles/${article.slug}`} className="inline-flex min-h-9 items-center gap-1 font-medium text-brand transition hover:text-brand-strong">阅读全文<ArrowRight className="size-3.5" /></Link>
        </div>
      </div>
    </article>
  );
});
ArticleCard.displayName = 'ArticleCard';

const ArticleTimeline = ({ articles }: ArticleTimelineProps) => {
  const groups = useMemo(() => {
    const grouped = new Map<string, Article[]>();
    for (const article of articles) {
      const date = article.display_date || article.created_at;
      const key = formatArticleDate(date);
      grouped.set(key, [...(grouped.get(key) || []), article]);
    }
    return Array.from(grouped.entries());
  }, [articles]);

  if (articles.length === 0) {
    return <p className="py-12 text-center text-sm text-slate-500">暂时没有可显示的文章。</p>;
  }

  return (
    <div className="space-y-7">
      {groups.map(([date, items]) => (
        <section key={date} aria-label={date}>
          <div className="mb-3 flex items-center gap-3"><span className="text-sm font-semibold text-slate-700">{date}</span><span className="h-px flex-1 bg-slate-200" /></div>
          <div className="grid items-start gap-3 md:grid-cols-2">
            {items.map((article) => <ArticleCard key={article.id} article={article} />)}
          </div>
        </section>
      ))}
    </div>
  );
};

export default ArticleTimeline;
