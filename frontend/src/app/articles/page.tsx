import React from 'react';
import Link from 'next/link';
import { Article } from '@/types/models'; // 假设类型已定义或将要定义

// 定义从 API 获取的数据结构 (包含文章列表和分页信息)
interface ArticlesApiResponse {
  articles: Article[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// 定义页面 props 类型，包含 searchParams (page 和 category)
interface ArticlesPageProps {
  searchParams?: {
    page?: string | string[] | undefined;
    category?: string | string[] | undefined; // 添加 category slug
   };
}


// 在服务器组件中获取数据
async function getArticlesData(page = 1, limit = 10, categorySlug?: string): Promise<ArticlesApiResponse | null> {
  // 注意：在服务器组件中 fetch，需要使用绝对 URL 或配置环境变量
  // 假设后端运行在 http://localhost:8787 (wrangler dev 的默认端口)
  // 在生产环境中，这需要是部署后的后端 URL
  const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8787';
  let apiUrl = `${backendUrl}/api/articles?page=${page}&limit=${limit}`;
  // 如果提供了 categorySlug，添加到 URL
  if (categorySlug) {
    apiUrl += `&category=${encodeURIComponent(categorySlug)}`;
  }

  try {
    console.log(`Fetching articles from: ${apiUrl}`);
    const res = await fetch(apiUrl, {
      // next: { revalidate: 60 } // 可选：设置 ISR 重新验证时间（秒）
      cache: 'no-store', // 暂时禁用缓存，以便看到最新数据
    });

    if (!res.ok) {
      console.error(`Failed to fetch articles: ${res.status} ${res.statusText}`);
      const errorBody = await res.text();
      console.error(`Error body: ${errorBody}`);
      // throw new Error(`Failed to fetch articles: ${res.statusText}`);
      return null; // 返回 null 以便页面处理错误
    }

    const data: ArticlesApiResponse = await res.json();
    console.log(`Fetched ${data.articles.length} articles.`);
    return data;
  } catch (error) {
    console.error('Error fetching articles data:', error);
    // throw error; // 可以向上抛出错误，让 Next.js 处理错误边界
    return null; // 返回 null
  }
}

// 文章列表页面组件 (异步服务器组件)
export default async function ArticlesPage({ searchParams }: ArticlesPageProps) {
  // 从 searchParams 获取页码和分类 slug
  const currentPage = parseInt(searchParams?.page as string || '1', 10) || 1;
  const categorySlug = typeof searchParams?.category === 'string' ? searchParams.category : undefined;
  const limit = 10; // 每页数量

  // 获取文章数据，传入页码和分类 slug
  const articlesData = await getArticlesData(currentPage, limit, categorySlug);

  // TODO: 如果按分类筛选，可能需要获取分类名称以显示标题

  if (!articlesData) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-6">
          {categorySlug ? `分类 "${categorySlug}" 下的文章` : '文章列表'}
        </h1>
        <p className="text-red-500">加载文章列表失败，请稍后重试。</p>
      </div>
    );
  }

  // 从 articlesData 解构时移除未使用的 total
  const { articles, page, totalPages } = articlesData;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">
        {categorySlug ? `分类 "${categorySlug}" 下的文章` : '文章列表'}
        {/* TODO: 显示实际分类名称 */}
      </h1>


      {articles.length === 0 ? (
        <p>{categorySlug ? '该分类下暂无文章。' : '暂无文章。'}</p>
      ) : (
        <div className="space-y-6">
          {articles.map((article) => (
            <article key={article.id} className="border rounded-lg p-4 shadow hover:shadow-md transition-shadow">
              <h2 className="text-2xl font-semibold mb-2">
                <Link href={`/articles/${article.slug}`} className="text-blue-600 hover:underline">
                  {article.title}
                </Link>
              </h2>
              {/* 可以显示摘要或部分内容，如果需要的话 */}
              {/* <p className="text-gray-700 mb-3">{article.content?.substring(0, 150)}...</p> */}
              <div className="text-sm text-gray-500">
                <span>分类: {article.category?.name || '未分类'}</span> | {/* 假设 Article 类型包含 category 对象 */}
                <span>发布于: {new Date(article.created_at).toLocaleDateString()}</span>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* 分页控件 - 需要在链接中保留 category 参数 */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center items-center space-x-4">
          <Link
            href={`/articles?page=${page - 1}${categorySlug ? `&category=${categorySlug}` : ''}`}
            className={`px-4 py-2 border rounded ${
              page <= 1 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white text-blue-600 hover:bg-gray-100'
            }`}
            aria-disabled={page <= 1}
            onClick={(e) => { if (page <= 1) e.preventDefault(); }} // 阻止无效点击
          >
            上一页
          </Link>
          <span className="text-gray-600">
            第 {page} 页 / 共 {totalPages} 页
          </span>
          <Link
            href={`/articles?page=${page + 1}${categorySlug ? `&category=${categorySlug}` : ''}`}
            className={`px-4 py-2 border rounded ${
              page >= totalPages ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white text-blue-600 hover:bg-gray-100'
            }`}
            aria-disabled={page >= totalPages}
            onClick={(e) => { if (page >= totalPages) e.preventDefault(); }} // 阻止无效点击
          >
            下一页
          </Link>
        </div>
      )}
    </div>
  );
}