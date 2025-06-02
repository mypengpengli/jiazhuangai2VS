export const runtime = 'edge';
import React from 'react';
import { Article } from '@/types/models';
import ArticleTimeline from '@/components/ArticleTimeline';

// 定义从 API 获取的数据结构
interface ArticlesData {
  items: Article[];
  pageTitle: string;
}

// 获取所有文章数据
async function getAllArticlesData(): Promise<ArticlesData | null> {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8787';
  const apiUrl = `${backendUrl}/api/articles?limit=100`; // 获取所有文章

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
    
    // 按日期降序排序
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          AI新鲜事
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          探索人工智能的最新进展，发现改变世界的技术创新
        </p>
      </div>

      {articles.length === 0 ? (
        <p className="text-center text-gray-600">暂无文章发布。</p>
      ) : (
        <ArticleTimeline articles={articles} />
      )}
    </div>
  );
}
