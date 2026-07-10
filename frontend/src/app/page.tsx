export const runtime = 'edge';

import Link from 'next/link';
import { ArrowRight, Flame, FolderKanban, Newspaper } from 'lucide-react';
import { Article } from '@/types/models';
import ArticleFeed from '@/components/ArticleFeed';
import SearchBox from '@/components/SearchBox';
import { primaryNavigation } from '@/lib/navigation';

const ARTICLE_PAGE_SIZE = 12;

type ArticlesData = {
  items: Article[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
};

const getArticles = async (params: string) => {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8787';
  const response = await fetch(`${backendUrl}/api/articles?${params}`, { next: { revalidate: 60 } });
  if (!response.ok) return null;
  return response.json() as Promise<{ items?: Article[]; current_page?: number; total_pages?: number; total_items?: number }>;
};

const getArticlesData = async (): Promise<ArticlesData | null> => {
  const data = await getArticles(`limit=${ARTICLE_PAGE_SIZE}&page=1&sortBy=display_date&orderDirection=desc`);
  if (!data) return null;
  return { items: data.items || [], currentPage: data.current_page || 1, totalPages: data.total_pages || 1, totalItems: data.total_items || 0 };
};

const getHotArticles = async () => {
  const data = await getArticles('limit=5&page=1&sortBy=view_count&orderDirection=desc');
  return data?.items || [];
};

export default async function Home() {
  const [articlesData, hotArticles] = await Promise.all([getArticlesData(), getHotArticles()]);

  if (!articlesData) {
    return <div className="page-shell py-16 text-center text-sm text-rose-600">资讯暂时无法加载，请稍后再试。</div>;
  }

  return (
    <div className="page-shell py-5 sm:py-7">
      <section className="glass-surface grid gap-4 p-4 sm:p-5 md:grid-cols-[minmax(0,1fr)_minmax(360px,0.9fr)] md:items-center">
        <div>
          <p className="text-sm font-semibold text-brand">AI 新鲜事</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl">把 AI 进展讲清楚</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">关注模型、工具与应用变化，快速找到值得继续阅读的内容。</p>
        </div>
        <SearchBox compact />
      </section>

      <div className="mt-7 grid gap-7 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section aria-labelledby="latest-heading">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2"><Newspaper className="size-5 text-brand" /><h2 id="latest-heading" className="text-xl font-bold text-slate-900">最新资讯</h2></div>
            <span className="text-sm text-slate-400">共 {articlesData.totalItems} 篇</span>
          </div>
          <ArticleFeed initialArticles={articlesData.items} initialPage={articlesData.currentPage} totalPages={articlesData.totalPages} totalItems={articlesData.totalItems} />
        </section>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <section className="surface-card p-4" aria-labelledby="hot-heading">
            <div className="mb-3 flex items-center gap-2"><Flame className="size-4 text-hot" /><h2 id="hot-heading" className="text-sm font-semibold text-slate-900">热门文章</h2></div>
            <ol className="grid gap-1">
              {hotArticles.map((article, index) => (
                <li key={article.id}>
                  <Link href={`/articles/${article.slug}`} className="flex min-h-11 items-start gap-3 rounded-control px-1 py-1.5 transition hover:bg-slate-50">
                    <span className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${index < 3 ? 'bg-orange-100 text-hot' : 'bg-slate-100 text-slate-500'}`}>{index + 1}</span>
                    <span className="line-clamp-2 text-sm leading-5 text-slate-700">{article.title}</span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>

          <section className="surface-card p-4" aria-labelledby="category-heading">
            <div className="mb-3 flex items-center gap-2"><FolderKanban className="size-4 text-brand" /><h2 id="category-heading" className="text-sm font-semibold text-slate-900">分类浏览</h2></div>
            <nav className="grid grid-cols-2 gap-1.5">
              {primaryNavigation.slice(1, -1).map(({ href, icon: Icon, label }) => <Link key={href} href={href} className="flex min-h-11 items-center gap-1.5 rounded-control px-2 text-xs font-medium text-slate-600 transition hover:bg-sky-50 hover:text-brand-strong"><Icon className="size-3.5 shrink-0" />{label}</Link>)}
            </nav>
          </section>

          <section className="surface-card p-4">
            <p className="text-sm font-semibold text-slate-900">本站经验分享</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">记录工具实践、内容工作流和网站维护过程。</p>
            <Link href="/experience" className="mt-3 inline-flex min-h-10 items-center gap-1 text-sm font-medium text-brand transition hover:text-brand-strong">进入文档中心<ArrowRight className="size-4" /></Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
