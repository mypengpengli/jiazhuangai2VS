/// <reference types="next" />
export const runtime = 'edge';
import React from 'react';
// import Link from 'next/link'; // Link is not directly used here anymore for pagination
import { Article } from '@/types/models';
import ArticleTimeline from '@/components/ArticleTimeline'; // 导入时间轴组件

// 更新分类映射，与Header中的映射保持一致，使用数据库中的实际slug
const categoryMappings = {
  'language-models': {
    name: '大语言模型',
    description: '各大厂商的语言模型动态',
    slugs: ['ge-chang-yu-yan-mo-xing'] // 对应数据库中的 "各厂语言模型"
  },
  'image-generation': {
    name: '生图模型',
    description: '最新的文生图、图生图技术',
    slugs: ['sheng-tu-3d-lei', 'sheng-tu-ping-mian-lei'] // 对应 "生图3D类" + "生图平面类"
  },
  'video-models': {
    name: '视频模型', 
    description: '探索视频生成与编辑的未来',
    slugs: ['shi-pin-mo-xing'] // 对应 "视频模型"
  },
  'audio-models': {
    name: '音频模型',
    description: '语音合成、音乐创作等AI应用', 
    slugs: ['yu-yin-mo-xing', 'yin-le-mo-xing'] // 对应 "语音模型" + "音乐模型"
  },
  'ai-hardware': {
    name: 'AI硬件',
    description: 'AI芯片、服务器及相关硬件设备',
    slugs: ['ai-ying-jian-she-bei'] // 对应 "AI硬件设备"
  },
  'ai-tools': {
    name: 'AI工具',
    description: '实用的AI软件和工具推荐',
    slugs: ['ai-kai-yuan-ruan-jian-gong-ju', 'ai-wei-kai-yuan-ruan-jian-gong-ju'] // 对应 "AI开源软件工具" + "AI未开源软件工具"
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
    category_slug?: string;
    category_slugs?: string; // 新增：支持多个分类
    [key: string]: string | string[] | undefined;
  }>;
}

// 在服务器组件中获取数据
async function getArticlesData(categorySlugParam?: string, categorySlugsParam?: string): Promise<ArticlesData | null> {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8787';
  let apiUrl = `${backendUrl}/api/articles?limit=100`; // 获取较多文章

  let actualCategorySlugs: string[] = [];
  let pageTitle = 'AI新鲜事'; // 默认标题

  // 处理多个分类的情况
  if (categorySlugsParam) {
    const slugsArray = categorySlugsParam.split(',');
    actualCategorySlugs = slugsArray;
    
    // 根据第一个分类设置页面标题
    const firstSlug = slugsArray[0];
    const mappingEntry = Object.entries(categoryMappings).find(([_key, mapping]) => 
      mapping.slugs.includes(firstSlug)
    );
    if (mappingEntry) {
      pageTitle = mappingEntry[1].name;
    } else {
      pageTitle = `多分类文章`;
    }
  }
  // 处理单个分类的情况
  else if (categorySlugParam && categorySlugParam !== 'all') {
    const mapping = categoryMappings[categorySlugParam as keyof typeof categoryMappings];
    if (mapping) {
      pageTitle = mapping.name;
      actualCategorySlugs = mapping.slugs;
    } else {
      // 直接使用传入的slug
      actualCategorySlugs = [categorySlugParam];
      pageTitle = `分类 ${categorySlugParam}下的文章`;
    }
  } else if (!categorySlugParam || categorySlugParam === 'all') {
    pageTitle = 'AI新鲜事'; // 显示所有文章
  }

  if (actualCategorySlugs.length > 0) {
    if (actualCategorySlugs.length === 1) {
      // 单个分类使用category参数
      apiUrl += `&category=${encodeURIComponent(actualCategorySlugs[0])}`;
    } else {
      // 多个分类使用categories参数
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
  const categorySlugFromQuery = resolvedSearchParams?.category_slug;
  const categorySlugsFromQuery = resolvedSearchParams?.category_slugs;

  const articlesData = await getArticlesData(categorySlugFromQuery, categorySlugsFromQuery);

  // If articlesData is null (error during fetch) or items is null/undefined (unexpected API response)
  if (!articlesData || !articlesData.items) {
    let title = 'AI新鲜事';
    if (categorySlugsFromQuery) {
      title = '多分类文章';
    } else if (categorySlugFromQuery) {
      const mapping = categoryMappings[categorySlugFromQuery as keyof typeof categoryMappings];
      title = mapping ? mapping.name : `分类 ${categorySlugFromQuery} 下的文章`;
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
