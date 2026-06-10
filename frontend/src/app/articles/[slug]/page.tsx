export const runtime = 'edge';
import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { Article } from '@/types/models'; // 复用类型定义
import ViewCounter from '@/components/ViewCounter';
import ReadingProgress from '@/components/ReadingProgress';

// 定义页面 props 类型，包含从动态路由获取的 slug
// params 和 searchParams 都是 Promise (Next.js 15)
interface ArticleDetailPageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}


// 在服务器组件中获取单篇文章数据
async function getArticleData(slug: string): Promise<Article | null> {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8787';
  const apiUrl = `${backendUrl}/api/articles/${slug}`;

  try {
    console.log(`Fetching article details from: ${apiUrl}`);
    const res = await fetch(apiUrl);

    if (res.status === 404) {
      console.log(`Article with slug '${slug}' not found (404).`);
      return null; // 文章不存在
    }

    if (!res.ok) {
      console.error(`Failed to fetch article ${slug}: ${res.status} ${res.statusText}`);
      const errorBody = await res.text();
      console.error(`Error body: ${errorBody}`);
      return null;
    }

    const article: Article = await res.json();
    console.log(`Fetched article: ${article.title}`);

    // Construct publicUrl for attachments if prefix is available
    if (article && article.attachments && Array.isArray(article.attachments)) {
      const r2PublicUrlPrefix = process.env.NEXT_PUBLIC_R2_PUBLIC_URL_PREFIX;
      if (r2PublicUrlPrefix) {
        article.attachments = article.attachments.map(att => {
          const fileKey = typeof att.file_url === 'string' ? att.file_url : '';
          return {
            ...att,
            publicUrl: `${r2PublicUrlPrefix.replace(/\/$/, '')}/${fileKey}`
          };
        });
      } else {
        console.warn("NEXT_PUBLIC_R2_PUBLIC_URL_PREFIX is not set, publicUrls for attachments might be incorrect.");
        article.attachments = article.attachments.map(att => ({
          ...att,
          publicUrl: att.file_url
        }));
      }
    }
    return article;
  } catch (error) {
    console.error(`Error fetching article data for slug ${slug}:`, error);
    return null;
  }
}

// 从 HTML/Markdown 内容中提取纯文本摘要（用于 SEO 描述）
function extractDescription(content: string | undefined, maxLength = 160): string {
  if (!content) return '加装AI助手 - AI资讯与工具导航';
  const plainText = content
    .replace(/<[^>]+>/g, ' ')          // 去掉 HTML 标签
    .replace(/[#*`>\-\[\]()!|]/g, ' ') // 去掉常见 Markdown 符号
    .replace(/\s+/g, ' ')
    .trim();
  return plainText.slice(0, maxLength) || '加装AI助手 - AI资讯与工具导航';
}

// 为每篇文章生成独立的 SEO 元数据
export async function generateMetadata({ params }: ArticleDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleData(slug);
  if (!article) {
    return { title: '文章未找到 - 加装AI助手' };
  }
  const description = extractDescription(article.content);
  return {
    title: `${article.title} - 加装AI助手`,
    description,
    openGraph: {
      title: article.title,
      description,
      type: 'article',
    },
  };
}

// 文章详情页面组件 (异步服务器组件)
export default async function ArticleDetailPage({ params }: ArticleDetailPageProps) {
  const { slug } = await params;

  const article = await getArticleData(slug);

  // 如果获取数据失败或文章不存在，显示 404 页面
  if (!article) {
    notFound();
  }

  const displayDate = new Date(article.display_date || article.created_at);
  const categoryName = article.category?.name || '未分类';
  const categoryHref = article.category?.slug ? `/articles?category=${article.category.slug}` : '/articles';

  return (
    <div className="max-w-4xl mx-auto">
      {/* 阅读进度条 */}
      <ReadingProgress />

      {/* 面包屑导航 */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-purple-600 transition-colors">首页</Link>
        <span>/</span>
        <Link href={categoryHref} className="hover:text-purple-600 transition-colors">{categoryName}</Link>
        <span>/</span>
        <span className="text-gray-700 truncate max-w-[50%]">{article.title}</span>
      </nav>

      <article className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-10">
        {/* 文章头部 */}
        <header className="mb-8 pb-6 border-b border-gray-100">
          <Link href={categoryHref}>
            <span className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-cyan-50 to-purple-50 text-purple-700 rounded-full text-xs font-semibold border border-purple-100 mb-4 hover:border-purple-300 transition-colors">
              {categoryName}
            </span>
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-4">{article.title}</h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
            <span className="inline-flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {displayDate.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
            <ViewCounter slug={article.slug} initialCount={article.view_count ?? 0} />
          </div>
        </header>

        {/* 文章内容 */}
        {article.content ? (
          article.content_type === 'html' ? (
            <div className="article-content" dangerouslySetInnerHTML={{ __html: article.content }} />
          ) : (
            <div className="article-content">
              <MarkdownRenderer content={article.content} />
            </div>
          )
        ) : (
          <p className="text-gray-500">文章内容为空。</p>
        )}

        {/* 文章底部操作 */}
        <footer className="mt-10 pt-6 border-t border-gray-100 flex flex-wrap gap-3">
          <Link href="/">
            <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-sm font-medium transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              返回首页
            </span>
          </Link>
          <Link href={categoryHref}>
            <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white rounded-full text-sm font-medium transition-colors">
              更多{categoryName}文章
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </span>
          </Link>
        </footer>
      </article>
    </div>
  );
}
