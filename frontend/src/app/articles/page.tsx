/// <reference types="next" />
export const runtime = 'edge';
import React from 'react';
// import Link from 'next/link'; // Link is not directly used here anymore for pagination
import { Article } from '@/types/models';
import ArticleTimeline from '@/components/ArticleTimeline'; // 导入时间轴组件

// 更新分类映射，使用图片中正确的数据库slug
const categoryMappings = {
  'language-models': {
    name: '大语言模型',
    description: '各大厂商的语言模型动态',
    slugs: ['test'] // 对应数据库中的 "各厂语言模型"
  },
  'image-generation': {
    name: '生图模型',
    description: '最新的文生图、图生图技术',
    slugs: ['s', 'thyroid-basics'] // 对应 "生图3D类" + "生图平面类"
  },
  'video-models': {
    name: '视频模型', 
    description: '探索视频生成与编辑的未来',
    slugs: ['video'] // 对应 "视频模型"
  },
  'audio-models': {
    name: '音频模型',
    description: '语音合成、音乐创作等AI应用', 
    slugs: ['voice', 'music'] // 对应 "语音模型" + "音乐模型"
  },
  'ai-hardware': {
    name: 'AI硬件',
    description: 'AI芯片、服务器及相关硬件设备',
    slugs: ['hardware'] // 对应 "AI硬件设备"
  },
  'ai-tools': {
    name: 'AI工具',
    description: '实用的AI软件和工具推荐',
    slugs: ['soft', 'locksoft'] // 对应 "AI开源软件工具" + "AI未开源软件工具"
  }
};

// 定义从 API 获取的数据结构 (包含文章列表和页面标题)
interface ArticlesData {
  items: Article[];
  pageTitle: string;
}

// 定义页面 props 类型，包含 searchParams
interface ArticlesPageProps {
  searchParams: Promise<{
    category?: string; // 修改：读取 category
    categories?: string; // 修改：读取 categories
    [key: string]: string | string[] | undefined;
  }>;
}

// 在服务器组件中获取数据
async function getArticlesData(categoryParam?: string, categoriesParam?: string): Promise<ArticlesData | null> {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8787';
  let apiUrl = `${backendUrl}/api/articles?limit=100`; // 获取较多文章

  let actualCategorySlugs: string[] = [];
  let pageTitle = 'AI新鲜事'; // 默认标题

  if (categoriesParam) {
    const slugsArray = categoriesParam.split(',').map(s => s.trim()).filter(s => s.length > 0);
    if (slugsArray.length > 0) {
      actualCategorySlugs = slugsArray;
      // 根据第一个slug在categoryMappings中找到对应的名称
      const firstSlug = slugsArray[0];
      const mappingEntry = Object.values(categoryMappings).find(mapping => mapping.slugs.includes(firstSlug));
      if (mappingEntry) {
        pageTitle = mappingEntry.name;
      } else {
        pageTitle = `多分类文章`; // Fallback
      }
    }
  } else if (categoryParam && categoryParam !== 'all') {
    actualCategorySlugs = [categoryParam];
    // 根据单个slug在categoryMappings中找到对应的名称
    const mappingEntry = Object.values(categoryMappings).find(mapping => mapping.slugs.includes(categoryParam));
    if (mappingEntry) {
      pageTitle = mappingEntry.name;
    } else {
      pageTitle = `分类 ${categoryParam}下的文章`; // Fallback
    }
  }
  // 如果是 'all' 或没有指定分类，则 pageTitle 保持 'AI新鲜事'

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
      const errorBody = await res.text();
      console.error(`Error body: ${errorBody}`);
      return null;
    }

    const responseData: { items: Article[] } = await res.json();
    
    if (!responseData || !responseData.items) {
      console.error('Fetched data is not in the expected format (missing items):', responseData);
      return { items: [], pageTitle };
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
  
  const categoryFromQuery = resolvedSearchParams?.category; // 修改：读取 category
  const categoriesFromQuery = resolvedSearchParams?.categories; // 修改：读取 categories

  const articlesData = await getArticlesData(categoryFromQuery, categoriesFromQuery); // 修改：传递正确的参数

  if (!articlesData || !articlesData.items) {
    let title = 'AI新鲜事'; // 默认标题
    // 根据传入的参数尝试恢复标题，逻辑与 getArticlesData 中类似
    if (categoriesFromQuery) {
        const slugsArray = categoriesFromQuery.split(',').map(s => s.trim()).filter(s => s.length > 0);
        if (slugsArray.length > 0) {
            const firstSlug = slugsArray[0];
            const mappingEntry = Object.values(categoryMappings).find(mapping => mapping.slugs.includes(firstSlug));
            title = mappingEntry ? mappingEntry.name : `多分类文章`;
        }
    } else if (categoryFromQuery && categoryFromQuery !== 'all') {
        const mappingEntry = Object.values(categoryMappings).find(mapping => mapping.slugs.includes(categoryFromQuery));
        title = mappingEntry ? mappingEntry.name : `分类 ${categoryFromQuery} 下的文章`;
    }
    
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-10 text-center text-gray-800">
          {title}
        </h1>
        <p className="text-red-500 text-center">加载文章列表失败，或该分类下暂无文章。请稍后重试。</p>
      </div>
    );
  }

  const { items: articles, pageTitle } = articlesData;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          {pageTitle}
        </h1>
        {pageTitle !== 'AI新鲜事' && (
          <p className="text-xl text-gray-600">
            {categoryMappings[Object.keys(categoryMappings).find(_key => 
              categoryMappings[_key as keyof typeof categoryMappings].name === pageTitle
            ) as keyof typeof categoryMappings]?.description || '专业AI内容分享'}
          </p>
        )}
      </div>

      {articles.length === 0 ? (
        <p className="text-center text-gray-600">该分类下暂无文章。</p>
      ) : (
        <ArticleTimeline articles={articles} />
      )}
    </div>
  );
}
