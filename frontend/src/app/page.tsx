export const runtime = 'edge';
import React from 'react';
import { Article } from '@/types/models';
import ArticleTimeline from '@/components/ArticleTimeline';
import SearchBox from '@/components/SearchBox';
import Link from 'next/link';

// 定义从 API 获取的数据结构
interface ArticlesData {
  items: Article[];
  pageTitle: string;
}

// 获取所有文章数据
async function getAllArticlesData(): Promise<ArticlesData | null> {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8787';
  const apiUrl = `${backendUrl}/api/articles?limit=100`;

  try {
    console.log(`Fetching articles from: ${apiUrl}`);
    const res = await fetch(apiUrl, {
      next: { revalidate: 60 }
    });

    if (!res.ok) {
      console.error(`Failed to fetch articles: ${res.status} ${res.statusText}`);
      const errorBody = await res.text();
      console.error(`Error body: ${errorBody}`);
      return null;
    }

    const responseData: { items: Article[] } = await res.json();
    
    if (!responseData || !responseData.items) {
      console.error('Fetched data is not in the expected format (missing items):', responseData);
      return { items: [], pageTitle: 'AI新鲜事' };
    }
    
    console.log(`Fetched ${responseData.items.length} articles.`);
    
    responseData.items.sort((a, b) => {
      const dateA = new Date(a.display_date || a.created_at).getTime();
      const dateB = new Date(b.display_date || b.created_at).getTime();
      return dateB - dateA;
    });
    
    return { items: responseData.items, pageTitle: 'AI新鲜事' };
  } catch (error) {
    console.error('Error fetching articles data:', error);
    return null;
  }
}

// 热门文章：按真实浏览量从后端获取，失败时回退为最新 5 篇
async function getHotArticles(fallback: Article[]): Promise<Article[]> {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8787';
  const apiUrl = `${backendUrl}/api/articles?limit=5&sortBy=view_count&orderDirection=desc`;

  try {
    const res = await fetch(apiUrl, { next: { revalidate: 300 } });
    if (res.ok) {
      const data: { items: Article[] } = await res.json();
      if (data?.items?.length) {
        return data.items;
      }
    }
  } catch (error) {
    console.error('Error fetching hot articles:', error);
  }
  return fallback.slice(0, 5);
}

export default async function Home() {
  const articlesData = await getAllArticlesData();

  if (!articlesData || !articlesData.items) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-10 text-center text-gray-800">AI新鲜事</h1>
        <p className="text-red-500 text-center">加载文章列表失败，请稍后重试。</p>
      </div>
    );
  }

  const { items: articles } = articlesData;
  const hotArticles = await getHotArticles(articles);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#eefbff_36%,#f7f5ff_68%,#ffffff_100%)]">
      {/* Compact Search Section */}
      <div className="mx-auto max-w-3xl overflow-hidden rounded-xl border border-white/70 bg-white/45 shadow-[0_18px_60px_rgba(56,189,248,0.16)] backdrop-blur-2xl">
        <div className="flex flex-col gap-4 px-4 py-4 sm:px-5 md:flex-row md:items-center md:justify-between md:px-6">
          <div className="text-center md:max-w-xs md:text-left">
            <h1 className="text-xl font-bold leading-tight sm:text-2xl">
              <span className="bg-gradient-to-r from-slate-900 via-sky-700 to-violet-700 bg-clip-text text-transparent">
                AI新鲜事
              </span>
            </h1>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              快速发现最新模型、工具和实用资讯
            </p>
          </div>

          <div className="w-full md:max-w-sm">
            <SearchBox compact />
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="container mx-auto px-4 py-4 md:py-5">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* 左侧：文章时间轴 */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1.5 h-8 bg-gradient-to-b from-cyan-400 to-violet-500 rounded-full"></div>
              <h2 className="text-2xl font-bold text-gray-800">最新资讯</h2>
            </div>
            
            {articles.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="text-6xl mb-4">📭</div>
                <p className="text-gray-600 text-lg">暂无文章发布，敬请期待...</p>
              </div>
            ) : (
              <ArticleTimeline articles={articles} />
            )}
          </div>

          {/* 右侧：侧边栏（大屏跟随滚动） */}
          <div className="lg:w-80 space-y-6 lg:sticky lg:top-6 lg:self-start">
            {/* 热门文章 */}
            <div className="bg-white/70 rounded-2xl shadow-sm shadow-sky-900/5 border border-white/70 overflow-hidden backdrop-blur-xl">
              <div className="border-b border-white/70 bg-white/55 px-5 py-4">
                <h3 className="text-lg font-bold bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent flex items-center gap-2">
                  🔥 热门文章
                </h3>
              </div>
              <div className="p-4">
                {hotArticles.length > 0 ? (
                  <ul className="space-y-3">
                    {hotArticles.map((article, index) => (
                      <li key={article.id}>
                        <Link href={`/articles/${article.slug}`}>
                          <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/70 transition-colors cursor-pointer group">
                            <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                              index === 0 ? 'bg-gradient-to-r from-red-500 to-orange-500' :
                              index === 1 ? 'bg-gradient-to-r from-orange-500 to-amber-500' :
                              index === 2 ? 'bg-gradient-to-r from-amber-500 to-yellow-500' :
                              'bg-gray-400'
                            }`}>
                              {index + 1}
                            </span>
                            <div className="min-w-0">
                              <span className="block text-sm text-slate-700 group-hover:text-sky-700 transition-colors line-clamp-2">
                                {article.title}
                              </span>
                              {typeof article.view_count === 'number' && article.view_count > 0 && (
                                <span className="mt-1 inline-flex items-center gap-1 text-xs text-gray-400">
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                  {article.view_count.toLocaleString()} 次阅读
                                </span>
                              )}
                            </div>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-sm text-center py-4">暂无热门文章</p>
                )}
              </div>
            </div>

            {/* 分类导航 */}
            <div className="bg-white/70 rounded-2xl shadow-sm shadow-sky-900/5 border border-white/70 overflow-hidden backdrop-blur-xl">
              <div className="border-b border-white/70 bg-white/55 px-5 py-4">
                <h3 className="text-lg font-bold bg-gradient-to-r from-cyan-600 to-violet-600 bg-clip-text text-transparent flex items-center gap-2">
                  📂 分类导航
                </h3>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { icon: '💬', name: '大语言模型', href: '/articles?category=test' },
                    { icon: '🎨', name: '生图模型', href: '/articles?categories=s,thyroid-basics' },
                    { icon: '🎬', name: '视频模型', href: '/articles?category=video' },
                    { icon: '🎵', name: '音频模型', href: '/articles?categories=voice,music' },
                    { icon: '🔧', name: 'AI硬件', href: '/articles?category=hardware' },
                    { icon: '⚡', name: 'AI工具', href: '/articles?categories=soft,locksoft' },
                  ].map((cat) => (
                    <Link key={cat.name} href={cat.href}>
                      <span className="flex items-center gap-2 px-3 py-2.5 bg-white/50 hover:bg-white/80 rounded-lg text-sm text-slate-700 hover:text-sky-700 transition-all duration-300 cursor-pointer border border-white/40 hover:border-sky-200/80">
                        {cat.icon} {cat.name}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* 关于我们 */}
            <div className="bg-white/70 rounded-2xl p-5 text-slate-700 border border-white/70 shadow-sm shadow-sky-900/5 backdrop-blur-xl">
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2 bg-gradient-to-r from-sky-700 to-violet-700 bg-clip-text text-transparent">
                🚀 关于加装AI助手
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                我们致力于为你提供最前沿的AI资讯、模型介绍和工具推荐，帮助你快速了解和使用最新的人工智能技术。
              </p>
              <Link href="/about">
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 hover:bg-white/85 rounded-lg text-sm font-medium text-sky-700 transition-colors cursor-pointer border border-white/70">
                  了解更多 →
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
