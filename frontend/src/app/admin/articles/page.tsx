'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, FilePenLine, FolderTree, LoaderCircle, Pencil, Plus, Trash2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Article } from '@/types/models';
import { useAuth } from '@/context/AuthContext';
import { buildExperienceDocTree, flattenExperienceDocTree } from '@/lib/experienceDocs';
import { formatArticleDate } from '@/lib/formatters';

const PAGE_SIZE = 30;
const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8787';

export default function AdminArticlesPage() {
  const { token } = useAuth();
  const searchParams = useSearchParams();
  const categoryFilter = searchParams.get('category') || '';
  const isExperience = categoryFilter === 'site-experience';
  const [articles, setArticles] = useState<Article[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const visibleArticles = useMemo(() => isExperience ? flattenExperienceDocTree(buildExperienceDocTree(articles)).map((entry) => ({ ...entry.article, depth: entry.depth })) : articles.map((article) => ({ ...article, depth: 0 })), [articles, isExperience]);

  const fetchArticles = useCallback(async (page = 1, append = false) => {
    if (!token) return;
    if (append) setIsLoadingMore(true);
    else setIsLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams({ limit: String(isExperience ? 200 : PAGE_SIZE), page: String(page), sortBy: 'display_date', orderDirection: 'desc' });
      if (categoryFilter) query.set('category', categoryFilter);
      const response = await fetch(`${backendUrl}/api/articles?${query}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || '获取文章列表失败');
      setArticles((current) => append ? [...current, ...(data.items || [])] : (data.items || []));
      setCurrentPage(data.current_page || page); setTotalPages(data.total_pages || 1); setTotalItems(data.total_items || 0);
    } catch (reason) { setError(reason instanceof Error ? reason.message : '获取文章列表失败'); }
    finally { setIsLoading(false); setIsLoadingMore(false); }
  }, [categoryFilter, isExperience, token]);
  useEffect(() => { void fetchArticles(1); }, [fetchArticles]);
  const remove = async (article: Article) => {
    if (!token || !window.confirm(`确定删除“${article.title}”？删除后不能恢复。`)) return;
    setDeletingId(article.id);
    try { const response = await fetch(`${backendUrl}/api/articles/${article.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }); const data = await response.json().catch(() => null); if (!response.ok) throw new Error(data?.error || '删除文章失败'); setArticles((items) => items.filter((item) => item.id !== article.id)); setTotalItems((count) => Math.max(0, count - 1)); }
    catch (reason) { setError(reason instanceof Error ? reason.message : '删除文章失败'); }
    finally { setDeletingId(null); }
  };
  const addHref = isExperience ? '/admin/articles/new?category=site-experience' : '/admin/articles/new';
  return <section><div className="flex flex-wrap items-end justify-between gap-4"><div><div className="flex items-center gap-2"><FilePenLine className="size-5 text-brand" /><h2 className="text-2xl font-bold text-slate-950">{isExperience ? '本站经验分享' : '文章管理'}</h2></div><p className="mt-2 text-sm text-slate-500">{isExperience ? '父级文档决定侧栏层级，目录支持任意深度。' : `当前已加载 ${articles.length} / ${totalItems || articles.length} 篇。`}</p></div><Link href={addHref} className="inline-flex min-h-10 items-center gap-2 rounded-control bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-700"><Plus className="size-4" />{isExperience ? '新建经验文档' : '新建文章'}</Link></div>{isExperience && <div className="mt-5 flex items-start gap-3 rounded-control border border-sky-100 bg-sky-50/70 p-4 text-sm leading-6 text-slate-700"><FolderTree className="mt-0.5 size-4 shrink-0 text-brand" /><p>新建或编辑文档时选择“父级文档”即可归入目录。根文档不选父级，子文档可继续作为下一层的父级。</p></div>}{error && <p role="alert" className="mt-4 rounded-control border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}<div className="surface-card mt-6 overflow-hidden">{isLoading ? <div className="flex min-h-52 items-center justify-center gap-2 text-sm text-slate-500"><LoaderCircle className="size-4 animate-spin" />正在加载文章...</div> : visibleArticles.length === 0 ? <div className="py-14 text-center"><p className="text-sm text-slate-500">还没有可管理的文章。</p><Link href={addHref} className="mt-3 inline-flex text-sm font-medium text-brand hover:underline">创建第一篇</Link></div> : <ul className="divide-y divide-slate-100">{visibleArticles.map((article) => <li key={article.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"><div className="min-w-0" style={isExperience ? { paddingLeft: `${article.depth * 1.1}rem` } : undefined}><div className="flex min-w-0 items-center gap-2">{isExperience && <FolderTree className="size-4 shrink-0 text-slate-300" />}<Link href={article.slug ? (isExperience ? `/experience?slug=${article.slug}` : `/articles/${article.slug}`) : '#'} target="_blank" className="truncate font-medium text-slate-900 hover:text-brand">{article.title}</Link></div><div className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-slate-400"><span>{article.category?.name || '未分类'}</span><span>{formatArticleDate(article.display_date || article.created_at)}</span><span>{article.view_count || 0} 次阅读</span></div></div><div className="flex shrink-0 items-center gap-1"><Link href={article.slug ? (isExperience ? `/experience?slug=${article.slug}` : `/articles/${article.slug}`) : '#'} target="_blank" title="预览" className="inline-flex size-9 items-center justify-center rounded-control text-slate-500 hover:bg-slate-100"><ExternalLink className="size-4" /></Link>{article.slug && <Link href={`/admin/articles/edit/${article.slug}`} title="编辑" className="inline-flex size-9 items-center justify-center rounded-control text-brand hover:bg-sky-50"><Pencil className="size-4" /></Link>}<button type="button" title="删除" disabled={deletingId === article.id} onClick={() => void remove(article)} className="inline-flex size-9 items-center justify-center rounded-control text-rose-700 hover:bg-rose-50 disabled:opacity-50"><Trash2 className="size-4" /></button></div></li>)}</ul>}</div>{!isExperience && currentPage < totalPages && <div className="mt-6 flex justify-center"><button type="button" onClick={() => void fetchArticles(currentPage + 1, true)} disabled={isLoadingMore} className="min-h-10 rounded-control border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">{isLoadingMore ? '正在加载...' : '加载更多文章'}</button></div>}</section>;
}
