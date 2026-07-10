export const runtime = 'edge';

import Link from 'next/link';
import { FolderSearch, Search } from 'lucide-react';
import { redirect } from 'next/navigation';
import { Article } from '@/types/models';
import ArticleFeed from '@/components/ArticleFeed';
import SearchBox from '@/components/SearchBox';

const ARTICLE_PAGE_SIZE = 12;

const categoryMappings = {
  'test': { name: '大语言模型', description: '语言模型、Agent 与推理能力的最新动态' },
  's': { name: '生图模型', description: '图像生成、编辑与视觉模型进展' },
  'thyroid-basics': { name: '生图模型', description: '图像生成、编辑与视觉模型进展' },
  'video': { name: '视频模型', description: '视频生成、编辑与多模态创作工具' },
  'voice': { name: '音频模型', description: '语音、音乐与音频理解模型' },
  'music': { name: '音频模型', description: '语音、音乐与音频理解模型' },
  'hardware': { name: 'AI硬件', description: '芯片、算力与 AI 基础设施' },
  'soft': { name: 'AI工具', description: '适合实际使用的 AI 软件与工作流' },
  'locksoft': { name: 'AI工具', description: '适合实际使用的 AI 软件与工作流' },
} as const;

type ArticlesPageProps = {
  searchParams: Promise<{ category?: string; categories?: string; search?: string }>;
};

const getArticles = async (query: Record<string, string | undefined>) => {
  const params = new URLSearchParams({ limit: String(ARTICLE_PAGE_SIZE), page: '1', sortBy: 'display_date', orderDirection: 'desc' });
  Object.entries(query).forEach(([key, value]) => { if (value) params.set(key, value); });
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8787';
  const response = await fetch(`${backendUrl}/api/articles?${params.toString()}`, { next: { revalidate: 60 } });
  if (!response.ok) return null;
  return response.json() as Promise<{ items?: Article[]; current_page?: number; total_pages?: number; total_items?: number }>;
};

export default async function ArticlesPage({ searchParams }: ArticlesPageProps) {
  const params = await searchParams;
  if (params.category === 'site-experience' || params.categories?.split(',').includes('site-experience')) redirect('/experience');

  const categorySlugs = params.categories?.split(',').map((item) => item.trim()).filter(Boolean) || (params.category ? [params.category] : []);
  const categoryInfo = categorySlugs.length ? categoryMappings[categorySlugs[0] as keyof typeof categoryMappings] : undefined;
  const title = params.search?.trim() ? `搜索：${params.search.trim()}` : categoryInfo?.name || '全部资讯';
  const description = params.search?.trim() ? '查看与关键词相关的文章结果' : categoryInfo?.description || '按时间浏览最新 AI 资讯';
  const data = await getArticles({ category: params.categories ? undefined : params.category, categories: params.categories, search: params.search?.trim() });

  if (!data) return <div className="page-shell py-16 text-center text-sm text-rose-600">文章列表暂时无法加载，请稍后再试。</div>;

  const items = data.items || [];
  return (
    <div className="page-shell py-5 sm:py-7">
      <section className="surface-card flex flex-col gap-4 p-4 sm:p-5 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-control bg-sky-50 text-brand">{params.search ? <Search className="size-5" /> : <FolderSearch className="size-5" />}</span>
          <div><h1 className="text-2xl font-bold text-slate-950">{title}</h1><p className="mt-1 text-sm text-slate-500">{description} · {data.total_items || 0} 篇</p></div>
        </div>
        <SearchBox initialValue={params.search || ''} compact className="w-full md:max-w-md" />
      </section>

      {items.length ? (
        <div className="mt-7"><ArticleFeed initialArticles={items} initialPage={data.current_page || 1} totalPages={data.total_pages || 1} totalItems={data.total_items || items.length} query={{ category: params.categories ? undefined : params.category, categories: params.categories, search: params.search?.trim() }} /></div>
      ) : (
        <section className="surface-card mt-7 py-16 text-center"><p className="text-base font-medium text-slate-700">没有找到匹配的文章</p><p className="mt-2 text-sm text-slate-500">可以更换关键词，或回到最新资讯继续浏览。</p><Link href="/" className="mt-5 inline-flex min-h-11 items-center rounded-control bg-brand px-4 text-sm font-medium text-white hover:bg-brand-strong">返回首页</Link></section>
      )}
    </div>
  );
}
