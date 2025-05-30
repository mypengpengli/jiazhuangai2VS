/// <reference types="next" />
export const runtime = 'edge';
import React from 'react';
import Link from 'next/link';
import { Category } from '@/types/models'; // 复用类型定义

// 定义从 API 获取的数据结构 (假设 API 直接返回 Category 数组)
// type CategoriesApiResponse = Category[]; // getCategoriesData is unused

// 定义顶级分类及其对应的子分类 slug
interface TopLevelCategory {
  name: string;
  slug: string; // 用于URL，也可能用于获取特定文章
  description?: string;
  children?: string[]; // 对应数据库中的 category slugs
}

const topLevelCategories: TopLevelCategory[] = [
  { name: 'AI新鲜事', slug: 'all', description: '所有最新AI文章' },
  { name: '大语言模型', slug: 'language-models', children: ['test'], description: '各大厂商的语言模型动态' },
  { name: '生图模型', slug: 'image-generation', children: ['s', 'thyroid-basics'], description: '最新的文生图、图生图技术' },
  { name: '视频模型', slug: 'video-models', children: ['video'], description: '探索视频生成与编辑的未来' },
  { name: '音频模型', slug: 'audio-models', children: ['voice', 'music'], description: '语音合成、音乐创作等AI应用' },
  { name: 'AI硬件', slug: 'ai-hardware', children: ['hardware'], description: 'AI芯片、服务器及相关硬件设备' },
  { name: 'AI工具', slug: 'ai-tools', children: ['soft', 'locksoft'], description: '实用的AI软件和工具推荐' },
  { name: '关于我们', slug: 'about', description: '了解我们的团队和使命' },
];

// 在服务器组件中获取数据 (此函数保持不变，用于获取所有原始分类)
/* getCategoriesData is unused
async function getCategoriesData(): Promise<CategoriesApiResponse | null> {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8787';
  const apiUrl = `${backendUrl}/api/categories`;

  try {
    console.log(`Fetching categories from: ${apiUrl}`);
    // @ts-expect-error // Using expect-error for fetch next option
    const res = await fetch(apiUrl, { next: { revalidate: 3600 } }); // Revalidate every hour

    if (!res.ok) {
      console.error(`Failed to fetch categories: ${res.status} ${res.statusText}`);
      const errorBody = await res.text();
      console.error(`Error body: ${errorBody}`);
      return null;
    }

    const data: CategoriesApiResponse = await res.json();
    console.log(`Fetched ${data.length} categories.`);
    return data;
  } catch (error) {
    console.error('Error fetching categories data:', error);
    return null;
  }
}
*/

// 分类列表页面组件 (异步服务器组件)
export default async function CategoriesPage() {
  // const categories = await getCategoriesData(); // 原始分类数据，暂时不用直接展示

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-10 text-center text-gray-800">探索AI新世界</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {topLevelCategories.map((category) => (
          <Link
            key={category.slug}
            href={category.slug === 'about' ? '/about' : `/articles?category_slug=${category.slug}`}
            // @ts-expect-error // Keeping for className if it's still an issue
            className="group block rounded-xl p-6 shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 bg-gradient-to-br from-purple-500 to-indigo-600 text-white overflow-hidden"
          >
            <h2 className="text-2xl font-semibold mb-3 group-hover:text-yellow-300 transition-colors duration-300">{category.name}</h2>
            <p className="text-sm text-indigo-100 group-hover:text-white transition-colors duration-300 min-h-[40px]">{category.description || '点击查看更多'}</p>
            {/* 未来可以添加图标等 */}
          </Link>
        ))}
      </div>

      {/* 
        树状结构时间轴显示文章的部分将会在 /articles 页面根据 category_slug 实现。
        当前页面仅作为顶级分类的导航。
        如果需要在本页直接展示部分文章，可以后续添加。
      */}
    </div>
  );
}

// 注意：文章列表的树状时间轴显示逻辑会比较复杂，
// 通常会涉及到新的组件和更详细的数据获取逻辑（例如获取特定分类下的文章并按时间排序）。
// 这个修改主要集中在顶级分类的展示和导航。
// `/articles?category_slug=${category.slug}` 将是实际文章列表页面的路由，
// 在那个页面中，你需要：
// 1. 解析 `category_slug` 参数。
// 2. 如果 slug 是 'all'，则获取所有文章。
// 3. 如果 slug 对应某个顶级分类，根据 `topLevelCategories` 中的 `children` 数组，
//    获取这些子分类slug对应的所有文章。
// 4. 获取文章数据后，再实现树状时间轴的UI。
