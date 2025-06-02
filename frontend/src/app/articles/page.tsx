/// <reference types="next" />
export const runtime = 'edge';
import React from 'react';
// import Link from 'next/link'; // Link is not directly used here anymore for pagination
import { Article } from '@/types/models';
import ArticleTimeline from '@/components/ArticleTimeline'; // 导入时间轴组件

// 从 categories/page.tsx 引入顶级分类定义
// 注意：这可能需要调整路径或将定义移至共享位置
const topLevelCategoriesForArticles = [
  { name: 'AI新鲜事', slug: 'all', description: '所有最新AI文章' },
  { name: '大语言模型', slug: 'language-models', children: ['test'], description: '各大厂商的语言模型动态' },
  { name: '生图模型', slug: 'image-generation', children: ['s', 'thyroid-basics'], description: '最新的文生图、图生图技术' },
  { name: '视频模型', slug: 'video-models', children: ['video'], description: '探索视频生成与编辑的未来' },
  { name: '音频模型', slug: 'audio-models', children: ['voice', 'music'], description: '语音合成、音乐创作等AI应用' },
  { name: 'AI硬件', slug: 'ai-hardware', children: ['hardware'], description: 'AI芯片、服务器及相关硬件设备' },
  { name: 'AI工具', slug: 'ai-tools', children: ['soft', 'locksoft'], description: '实用的AI软件和工具推荐' },
  // '关于我们' 是单独页面，不在此处处理
];

// 定义从 API 获取的数据结构 (包含文章列表和页面标题)
interface ArticlesData {
  items: Article[];
  pageTitle: string;
}

// 定义页面 props 类型，包含 searchParams (category_slug)
interface ArticlesPageProps {
  searchParams: Promise<{ // Made searchParams a Promise as required by Next.js
    category_slug?: string;
    [key: string]: string | string[] | undefined;
  }>;
}

// 在服务器组件中获取数据
async function getArticlesData(categorySlugParam?: string): Promise<ArticlesData | null> {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8787';
  let apiUrl = `${backendUrl}/api/articles?limit=100`; // 获取较多文章

  let actualCategorySlugs: string[] = [];
  let pageTitle = 'AI新鲜事'; // 默认标题

  if (categorySlugParam && categorySlugParam !== 'all') {
    const topLevelCat = topLevelCategoriesForArticles.find(tc => tc.slug === categorySlugParam);
    if (topLevelCat) {
      pageTitle = topLevelCat.name;
      if (topLevelCat.children && topLevelCat.children.length > 0) {
        actualCategorySlugs = topLevelCat.children;
      }
    } else {
      console.warn(`Unknown category_slug: ${categorySlugParam}, attempting to use it directly.`);
      actualCategorySlugs = [categorySlugParam]; // Assume it's a direct slug
      pageTitle = `分类 ${categorySlugParam}下的文章`; // Update title for direct slug
    }
  } else if (!categorySlugParam || categorySlugParam === 'all') {
    pageTitle = 'AI新鲜事'; // Explicitly set for 'all' or no slug
  }


  if (actualCategorySlugs.length > 0) {
    apiUrl += `&categories=${encodeURIComponent(actualCategorySlugs.join(','))}`;
  }

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

    // The backend directly returns ArticlesApiResponse like { items: Article[] }
    // We need to ensure the backend indeed returns this structure.
    // Let's assume the backend returns an object { items: Article[] }
    const responseData: { items: Article[] } = await res.json();
    
    if (!responseData || !responseData.items) {
      console.error('Fetched data is not in the expected format (missing items):', responseData);
      return { items: [], pageTitle }; // Return empty items but with title
    }
    
    console.log(`Fetched ${responseData.items.length} articles.`);
    
    responseData.items.sort((a, b) => {
      const dateA = new Date(a.display_date || a.created_at).getTime();
      const dateB = new Date(b.display_date || b.created_at).getTime();
      return dateB - dateA;
    });
    return { items: responseData.items, pageTitle };
  } catch (error) {
    console.error('Error fetching articles data:', error);
    return null;
  }
}

// 文章列表页面组件 (异步服务器组件)
export default async function ArticlesPage(props: ArticlesPageProps) {
  // Access searchParams by awaiting the Promise
  const resolvedSearchParams = await props.searchParams;
  const categorySlugFromQuery = resolvedSearchParams?.category_slug;

  const articlesData = await getArticlesData(categorySlugFromQuery);

  // If articlesData is null (error during fetch) or items is null/undefined (unexpected API response)
  if (!articlesData || !articlesData.items) {
    const title = categorySlugFromQuery 
        ? topLevelCategoriesForArticles.find(c => c.slug === categorySlugFromQuery)?.name || `分类 ${categorySlugFromQuery} 下的文章`
        : '文章列表';
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">
          {title}
        </h1>
        <p className="text-red-500">加载文章列表失败，或该分类下暂无文章。请稍后重试。</p>
      </div>
    );
  }

  const { items: articles, pageTitle } = articlesData;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-10 text-center text-gray-800">{pageTitle}</h1>

      {articles.length === 0 ? (
        <p className="text-center text-gray-600">该分类下暂无文章。</p>
      ) : (
        <ArticleTimeline articles={articles} />
      )}
    </div>
  );
}
