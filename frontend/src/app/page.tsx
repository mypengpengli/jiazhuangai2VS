export const runtime = 'edge';
import React from 'react';
import { Article } from '@/types/models';
import ArticleTimeline from '@/components/ArticleTimeline';
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

// 热门文章（取前5篇）
function getHotArticles(articles: Article[]): Article[] {
  return articles.slice(0, 5);
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
  const hotArticles = getHotArticles(articles);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* 动态背景效果 */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative container mx-auto px-4 py-20 md:py-28">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 mb-6 px-5 py-2.5 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 rounded-full text-cyan-400 text-sm font-medium backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
              为你加装最新AI能力
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
              <span className="bg-gradient-to-r from-white via-cyan-200 to-purple-200 bg-clip-text text-transparent">
                加装AI助手
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto leading-relaxed mb-10">
              探索人工智能的最新进展，发现改变世界的技术创新与实用工具
            </p>

            {/* 搜索框 */}
            <div className="max-w-xl mx-auto mb-10">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
                <div className="relative flex items-center bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 overflow-hidden">
                  <span className="pl-5 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </span>
                  <input 
                    type="text" 
                    placeholder="搜索AI模型、工具、资讯..." 
                    className="w-full px-4 py-4 bg-transparent text-white placeholder-gray-400 focus:outline-none"
                  />
                  <button className="px-6 py-4 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-medium hover:from-cyan-600 hover:to-purple-600 transition-all duration-300">
                    搜索
                  </button>
                </div>
              </div>
            </div>
            
            {/* 分类标签 */}
            <div className="flex justify-center gap-3 flex-wrap">
              {[
                { icon: '💬', name: '大语言模型', href: '/articles?category=test' },
                { icon: '🎨', name: '生图模型', href: '/articles?categories=s,thyroid-basics' },
                { icon: '🎬', name: '视频模型', href: '/articles?category=video' },
                { icon: '⚡', name: 'AI工具', href: '/articles?categories=soft,locksoft' },
              ].map((tag) => (
                <Link key={tag.name} href={tag.href}>
                  <span className="px-5 py-2.5 bg-white/5 hover:bg-white/15 rounded-full text-sm text-gray-300 border border-white/10 hover:border-cyan-500/50 transition-all duration-300 cursor-pointer inline-flex items-center gap-2 hover:scale-105 transform">
                    {tag.icon} {tag.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
        
        {/* 波浪分隔 */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="rgb(248 250 252)"/>
          </svg>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* 左侧：文章时间轴 */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-1.5 h-8 bg-gradient-to-b from-cyan-500 to-purple-500 rounded-full"></div>
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

          {/* 右侧：侧边栏 */}
          <div className="lg:w-80 space-y-6">
            {/* 热门文章 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-orange-500 to-pink-500 px-5 py-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  🔥 热门文章
                </h3>
              </div>
              <div className="p-4">
                {hotArticles.length > 0 ? (
                  <ul className="space-y-3">
                    {hotArticles.map((article, index) => (
                      <li key={article.id}>
                        <Link href={`/articles/${article.slug}`}>
                          <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group">
                            <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                              index === 0 ? 'bg-gradient-to-r from-red-500 to-orange-500' :
                              index === 1 ? 'bg-gradient-to-r from-orange-500 to-amber-500' :
                              index === 2 ? 'bg-gradient-to-r from-amber-500 to-yellow-500' :
                              'bg-gray-400'
                            }`}>
                              {index + 1}
                            </span>
                            <span className="text-sm text-gray-700 group-hover:text-purple-600 transition-colors line-clamp-2">
                              {article.title}
                            </span>
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
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-cyan-500 to-blue-500 px-5 py-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
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
                      <span className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 hover:bg-gradient-to-r hover:from-cyan-50 hover:to-purple-50 rounded-lg text-sm text-gray-700 hover:text-purple-700 transition-all duration-300 cursor-pointer border border-transparent hover:border-purple-200">
                        {cat.icon} {cat.name}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* 关于我们 */}
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-5 text-white">
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                🚀 关于加装AI助手
              </h3>
              <p className="text-sm text-white/90 leading-relaxed mb-4">
                我们致力于为你提供最前沿的AI资讯、模型介绍和工具推荐，帮助你快速了解和使用最新的人工智能技术。
              </p>
              <Link href="/about">
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors cursor-pointer">
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
