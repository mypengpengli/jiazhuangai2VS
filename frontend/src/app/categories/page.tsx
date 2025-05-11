export const runtime = 'edge';
import React from 'react';
import Link from 'next/link';
import { Category } from '@/types/models'; // 复用类型定义

// 定义从 API 获取的数据结构 (假设 API 直接返回 Category 数组)
type CategoriesApiResponse = Category[];

// 在服务器组件中获取数据
async function getCategoriesData(): Promise<CategoriesApiResponse | null> {
  const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8787';
  const apiUrl = `${backendUrl}/api/categories`;

  try {
    console.log(`Fetching categories from: ${apiUrl}`);
    const res = await fetch(apiUrl, { /* cache: 'no-store' */ }); // 移除 cache 选项

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

// 分类列表页面组件 (异步服务器组件)
export default async function CategoriesPage() {
  const categories = await getCategoriesData();

  if (!categories) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-6">文章分类</h1>
        <p className="text-red-500">加载分类列表失败，请稍后重试。</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">文章分类</h1>

      {categories.length === 0 ? (
        <p>暂无分类。</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/articles?category=${category.slug}`} // 链接到按分类筛选的文章列表
              className="block border rounded-lg p-6 shadow hover:shadow-lg hover:border-blue-500 transition-all duration-300 bg-white"
            >
              <h2 className="text-xl font-semibold mb-2 text-blue-700">{category.name}</h2>
              <p className="text-gray-600">{category.description || '暂无描述'}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}