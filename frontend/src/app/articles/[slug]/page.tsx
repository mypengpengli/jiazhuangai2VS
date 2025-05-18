export const runtime = 'edge';
import React from 'react';
import { notFound } from 'next/navigation';
// import Image from 'next/image'; // 用于显示文章图片 (暂时注释掉，因为特色图片逻辑已注释)
import { Article } from '@/types/models'; // 复用类型定义

// 定义页面 props 类型，包含从动态路由获取的 slug
// 定义页面 props 类型，params 和 searchParams 都是 Promise
// (即使我们不用 searchParams，也保持类型一致性)
interface ArticleDetailPageProps {
  params: Promise<{ slug: string }>; // 恢复为 Promise 类型以满足 PageProps 约束
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>; // 保持一致
}


// 在服务器组件中获取单篇文章数据
async function getArticleData(slug: string): Promise<Article | null> {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8787';
  const apiUrl = `${backendUrl}/api/articles/${slug}`;

  try {
    console.log(`Fetching article details from: ${apiUrl}`);
    const res = await fetch(apiUrl, { /* cache: 'no-store' */ }); // 移除 cache 选项

    if (res.status === 404) {
      console.log(`Article with slug '${slug}' not found (404).`);
      return null; // 文章不存在
    }

    if (!res.ok) {
      console.error(`Failed to fetch article ${slug}: ${res.status} ${res.statusText}`);
      const errorBody = await res.text();
      console.error(`Error body: ${errorBody}`);
      // 对于其他错误，可以选择抛出或返回 null
      // throw new Error(`Failed to fetch article: ${res.statusText}`);
      return null;
    }

    const article: Article = await res.json();
    console.log(`Fetched article: ${article.title}`);

    // Construct publicUrl for attachments if prefix is available
    if (article && article.attachments && Array.isArray(article.attachments)) {
      const r2PublicUrlPrefix = process.env.NEXT_PUBLIC_R2_PUBLIC_URL_PREFIX;
      if (r2PublicUrlPrefix) {
        article.attachments = article.attachments.map(att => {
          // Ensure file_url is a string and not undefined/null before concatenation
          const fileKey = typeof att.file_url === 'string' ? att.file_url : '';
          return {
            ...att,
            publicUrl: `${r2PublicUrlPrefix.replace(/\/$/, '')}/${fileKey}`
          };
        });
      } else {
        console.warn("NEXT_PUBLIC_R2_PUBLIC_URL_PREFIX is not set, publicUrls for attachments might be incorrect.");
        // Fallback: use file_url as publicUrl, which might be a relative path or incomplete
        article.attachments = article.attachments.map(att => ({
          ...att,
          publicUrl: att.file_url
        }));
      }
    }
    return article;
  } catch (error) {
    console.error(`Error fetching article data for slug ${slug}:`, error);
    // throw error;
    return null;
  }
}

// 文章详情页面组件 (异步服务器组件)
// 只解构需要的 params
export default async function ArticleDetailPage({ params }: ArticleDetailPageProps) {
  // 恢复 await params
  const { slug } = await params;

  const article = await getArticleData(slug);

  // 如果获取数据失败或文章不存在，显示 404 页面
  if (!article) {
    notFound(); // 调用 Next.js 的 notFound 函数
  }

  return (
    <article className="prose lg:prose-xl max-w-none"> {/* 使用 Tailwind Typography 插件美化 */}
      <h1 className="text-4xl font-bold mb-4">{article.title}</h1>
      <div className="text-sm text-gray-500 mb-6">
        <span>分类: {article.category?.name || '未分类'}</span> |
        <span>发布于: {new Date(article.created_at).toLocaleDateString()}</span> |
        <span>最后更新: {new Date(article.updated_at).toLocaleDateString()}</span>
      </div>

      {/*
        显示文章附件中的图片 (暂时注释掉，根据用户反馈，顶部大图不应显示)
      {article.attachments && article.attachments.find(att => att.file_type.startsWith('image/')) && (
        <div className="mb-8 flex justify-center">
          {article.attachments
            .filter(att => att.file_type.startsWith('image/'))
            .slice(0, 1)
            .map(imageAttachment => (
              <Image
                key={imageAttachment.id || imageAttachment.file_url}
                src={imageAttachment.publicUrl || imageAttachment.file_url}
                alt={imageAttachment.filename || article.title}
                width={800}
                height={450}
                className="rounded-lg shadow-md object-cover w-full"
                priority
              />
            ))}
        </div>
      )}
      */}

      {/* 文章内容 */}
      {article.content ? (
        article.content_type === 'html' ? (
          <div className="mt-6" dangerouslySetInnerHTML={{ __html: article.content }} />
        ) : (
          // 对于 markdown 或其他类型，可能需要不同的渲染方式
          // 暂时直接输出，或后续添加 Markdown 渲染器
          <div className="mt-6 whitespace-pre-wrap">{article.content}</div>
        )
      ) : (
        <p>文章内容为空。</p>
      )}
    </article>
  );
}

// (可选) 生成静态页面或设置动态元数据
// export async function generateStaticParams() {
//   // 获取所有文章 slug 用于 SSG
// }

// export async function generateMetadata({ params }: ArticleDetailPageProps): Promise<Metadata> {
//   const article = await getArticleData(params.slug);
//   return {
//     title: article?.title || '文章详情',
//     description: article?.content?.substring(0, 160) || '家装AI助手相关文章',
//   };
// }
