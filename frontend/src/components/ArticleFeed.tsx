'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Article } from '@/types/models';
import ArticleTimeline from './ArticleTimeline';

const PAGE_SIZE = 12;

interface ArticleFeedProps {
  initialArticles: Article[];
  initialPage: number;
  totalPages: number;
  totalItems: number;
  query?: Record<string, string | undefined>;
}

type ArticlesResponse = {
  items?: Article[];
  current_page?: number;
  total_pages?: number;
  total_items?: number;
};

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8787';

const ArticleFeed: React.FC<ArticleFeedProps> = ({
  initialArticles,
  initialPage,
  totalPages,
  totalItems,
  query = {},
}) => {
  const [articles, setArticles] = useState<Article[]>(initialArticles);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [knownTotalPages, setKnownTotalPages] = useState(totalPages);
  const [knownTotalItems, setKnownTotalItems] = useState(totalItems);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryKey = useMemo(() => JSON.stringify(query), [query]);

  useEffect(() => {
    setArticles(initialArticles);
    setCurrentPage(initialPage);
    setKnownTotalPages(totalPages);
    setKnownTotalItems(totalItems);
    setIsLoadingMore(false);
    setError(null);
  }, [initialArticles, initialPage, queryKey, totalItems, totalPages]);

  const hasMore = currentPage < knownTotalPages;
  const shownCount = articles.length;
  const displayTotal = knownTotalItems || shownCount;

  const loadMore = async () => {
    if (isLoadingMore || !hasMore) {
      return;
    }

    setIsLoadingMore(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        page: String(currentPage + 1),
        sortBy: 'display_date',
        orderDirection: 'desc',
      });

      Object.entries(query).forEach(([key, value]) => {
        if (value) {
          params.set(key, value);
        }
      });

      const response = await fetch(`${backendUrl}/api/articles?${params.toString()}`);
      const data: ArticlesResponse = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error((data as { message?: string }).message || '加载更多文章失败');
      }

      const incoming = data.items || [];
      setArticles((current) => {
        const existingIds = new Set(current.map((article) => article.id));
        return [...current, ...incoming.filter((article) => !existingIds.has(article.id))];
      });
      setCurrentPage(data.current_page || currentPage + 1);
      setKnownTotalPages(data.total_pages ?? knownTotalPages);
      setKnownTotalItems(data.total_items ?? knownTotalItems);
    } catch (err) {
      console.error('Failed to load more articles:', err);
      setError(err instanceof Error ? err.message : '加载更多文章失败');
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <div>
      <ArticleTimeline articles={articles} />

      <div className="mt-8 flex flex-col items-center gap-3">
        <div className="text-sm text-slate-400">
          已显示 {shownCount}
          {displayTotal ? ` / ${displayTotal}` : ''} 篇文章
        </div>

        {error && (
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        {hasMore ? (
          <button
            type="button"
            onClick={loadMore}
            disabled={isLoadingMore}
            className="min-h-11 rounded-control border border-sky-200 bg-white px-5 text-sm font-medium text-brand-strong shadow-sm transition hover:border-sky-300 hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoadingMore ? '加载中...' : '加载更多'}
          </button>
        ) : (
          <div className="py-2 text-sm text-slate-400">
            — 已显示全部文章 —
          </div>
        )}
      </div>
    </div>
  );
};

export default ArticleFeed;
