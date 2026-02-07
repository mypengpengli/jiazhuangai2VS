/// <reference types="next" />
export const runtime = 'edge';
import React from 'react';
import Link from 'next/link';
import { Article } from '@/types/models';
import ArticleTimeline from '@/components/ArticleTimeline';

// 更新分类映射，使用图片中正确的数据库slug
const categoryMappings = {
  'language-models': {
    name: '大语言模型',
    description: '各大厂商的语言模型动态',
    icon: '💬',
    slugs: ['test']
  },
  'image-generation': {
    name: '生图模型',
    description: '最新的文生图、图生图技术',
    icon: '🎨',
    slugs: ['s', 'thyroid-basics']
  },
  'video-models': {
    name: '视频模型', 
    description: '探索视频生成与编辑的未来',
    icon: '🎬',
    slugs: ['video']
  },
  'audio-models': {
    name: '音频模型',
    description: '语音合成、音乐创作等AI应用', 
    icon: '🎵',
    slugs: ['voice', 'music']
  },
  'ai-hardware': {
    name: 'AI硬件',
    description: 'AI芯片、服务器及相关硬件设备',
    icon: '🔧',
    slugs: ['hardware']
  },
  'ai-tools': {
    name: 'AI工具',
    description: '实用的AI软件和工具推荐',
    icon: '⚡',
    slugs: ['soft', 'locksoft']
  }
};

// 定义从 API 获取的数据结构
interface ArticlesData {
  items: Article[];
  pageTitle: string;
  totalCount: number;
}

// 定义页面 props 类型
interface ArticlesPageProps {
  searchParams: Promise<{
    category?: string;
    categories?: string;
    search?: string;
    [key: string]: string | string[] | undefined;
  }>;
}

// 获取文章数据
async function getArticlesData(categoryParam?: string, categoriesParam?: string, searchParam?: string): Promise<ArticlesData | null> {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8787';
  let apiUrl = `${backendUrl}/api/articles?limit=100`;

  let actualCategorySlugs: string[] = [];
  let pageTitle = 'AI新鲜事';

  if (searchParam && searchParam.trim()) {
    apiUrl += `&search=${encodeURIComponent(searchParam.trim())}`;
    pageTitle = `搜索: ${searchParam}`;
  } else if (categoriesParam) {
    const slugsArray = categoriesParam.split(',').map(s => s.trim()).filter(s => s.length > 0);
    if (slugsArray.length > 0) {
      actualCategorySlugs = slugsArray;
      const firstSlug = slugsArray[0];
      const mappingEntry = Object.values(categoryMappings).find(mapping => mapping.slugs.includes(firstSlug));
      if (mappingEntry) {
        pageTitle = mappingEntry.name;
      } else {
        pageTitle = `多分类文章`;
      }
    }
  } else if (categoryParam && categoryParam !== 'all') {
    actualCategorySlugs = [categoryParam];
    const mappingEntry = Object.values(categoryMappings).find(mapping => mapping.slugs.includes(categoryParam));
    if (mappingEntry) {
      pageTitle = mappingEntry.name;
    } else {
      pageTitle = `分类 ${categoryParam}下的文章`;
    }
  }

  if (actualCategorySlugs.length > 0) {
    if (actualCategorySlugs.length === 1) {
      apiUrl += `&category=${encodeURIComponent(actualCategorySlugs[0])}`;
    } else {
      apiUrl += `&categories=${encodeURIComponent(actualCategorySlugs.join(','))}`;
    }
  }

  try {
    console.log(`Fetching articles from: ${apiUrl}`);
    const res = await fetch(apiUrl, {
      next: { revalidate: 60 }
    });

    if (!res.ok) {
      console.error(`Failed to fetch articles: ${res.status} ${res.statusText}`);
      return null;
    }

    const responseData: { items: Article[] } = await res.json();
    
    if (!responseData || !responseData.items) {
      return { items: [], pageTitle, totalCount: 0 };
    }
    
    responseData.items.sort((a, b) => {
      const dateA = new Date(a.display_date || a.created_at).getTime();
      const dateB = new Date(b.display_date || b.created_at).getTime();
      return dateB - dateA;
    });
    
    return { items: responseData.items, pageTitle, totalCount: responseData.items.length };
  } catch (error) {
    console.error('Error fetching articles data:', error);
    return null;
  }
}

// 文章列表页面组件
export default async function ArticlesPage(props: ArticlesPageProps) {
  const resolvedSearchParams = await props.searchParams;
  
  const categoryFromQuery = resolvedSearchParams?.category;
  const categoriesFromQuery = resolvedSearchParams?.categories;
  const searchFromQuery = resolvedSearchParams?.search as string | undefined;

  const articlesData = await getArticlesData(categoryFromQuery, categoriesFromQuery, searchFromQuery);

  // 获取当前分类信息
  const getCurrentCategoryInfo = () => {
    if (searchFromQuery) return null;
    if (categoriesFromQuery) {
      const slugsArray = categoriesFromQuery.split(',').map(s => s.trim()).filter(s => s.length > 0);
      if (slugsArray.length > 0) {
        const firstSlug = slugsArray[0];
        return Object.values(categoryMappings).find(mapping => mapping.slugs.includes(firstSlug));
      }
    } else if (categoryFromQuery && categoryFromQuery !== 'all') {
      return Object.values(categoryMappings).find(mapping => mapping.slugs.includes(categoryFromQuery));
    }
    return null;
  };

  const currentCategory = getCurrentCategoryInfo();

  if (!articlesData || !articlesData.items) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <div className="container mx-auto px-4 py-16">
          <h1 className="text-4xl font-bold mb-10 text-center text-gray-800">
            {searchFromQuery ? `搜索: ${searchFromQuery}` : 'AI新鲜事'}
          </h1>
          <p className="text-red-500 text-center">加载文章列表失败，请稍后重试。</p>
        </div>
      </div>
    );
  }

  const { items: articles, pageTitle, totalCount } = articlesData;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* 页面头部 */}
      <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-16">
        <div className="container mx-auto px-4 text-center">
          {currentCategory && (
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-white/10 border border-white/20 rounded-full text-white/80 text-sm">
              <span className="text-xl">{currentCategory.icon}</span>
              <span>分类浏览</span>
            </div>
          )}
          {searchFromQuery && (
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-cyan-500/20 border border-cyan-500/30 rounded-full text-cyan-400 text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>搜索结果</span>
            </div>
          )}
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white via-cyan-200 to-purple-200 bg-clip-text text-transparent">
            {pageTitle}
          </h1>
          {currentCategory && (
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              {currentCategory.description}
            </p>
          )}
          <div className="mt-6 text-gray-400">
            共 <span className="text-cyan-400 font-semibold">{totalCount}</span> 篇文章
          </div>
        </div>
      </div>

      {/* 分类导航 */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 py-4 overflow-x-auto">
            <Link href="/">
              <span className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                !categoryFromQuery && !categoriesFromQuery && !searchFromQuery
                  ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
                🔥 全部
              </span>
            </Link>
            {Object.entries(categoryMappings).map(([key, value]) => {
              const isActive = value.slugs.some(slug => 
                categoryFromQuery === slug || 
                (categoriesFromQuery && categoriesFromQuery.split(',').includes(slug))
              );
              const href = value.slugs.length === 1 
                ? `/articles?category=${value.slugs[0]}`
                : `/articles?categories=${value.slugs.join(',')}`;
              
              return (
                <Link key={key} href={href}>
                  <span className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}>
                    {value.icon} {value.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* 文章列表 */}
      <div className="container mx-auto px-4 py-12">
        {articles.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-gray-600 text-lg mb-4">
              {searchFromQuery ? `没有找到与 "${searchFromQuery}" 相关的文章` : '该分类下暂无文章'}
            </p>
            <Link href="/">
              <span className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-full font-medium hover:shadow-lg transition-all">
                返回首页
              </span>
            </Link>
          </div>
        ) : (
          <ArticleTimeline articles={articles} />
        )}
      </div>
    </div>
  );
}
