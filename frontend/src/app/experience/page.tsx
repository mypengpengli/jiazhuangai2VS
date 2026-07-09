export const runtime = 'edge';

import React from 'react';
import Link from 'next/link';
import { Article } from '@/types/models';

const EXPERIENCE_CATEGORY = 'site-experience';

type ExperiencePageProps = {
  searchParams: Promise<{
    slug?: string;
  }>;
};

type ArticlesResponse = {
  items?: Article[];
};

type Heading = {
  id: string;
  text: string;
  level: number;
};

const stripTags = (html: string) => html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

const buildContentWithToc = (html?: string | null): { html: string; headings: Heading[] } => {
  if (!html) {
    return { html: '', headings: [] };
  }

  const headings: Heading[] = [];
  let index = 0;
  const content = html.replace(/<h([2-3])([^>]*)>([\s\S]*?)<\/h\1>/gi, (match, level, attrs, inner) => {
    const text = stripTags(inner);
    if (!text) {
      return match;
    }

    const id = `section-${index++}`;
    headings.push({ id, text, level: Number(level) });

    if (/\sid=["'][^"']+["']/.test(attrs)) {
      return match;
    }

    return `<h${level}${attrs} id="${id}">${inner}</h${level}>`;
  });

  return { html: content, headings };
};

const getExperienceArticles = async (): Promise<Article[]> => {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8787';
  const apiUrl = `${backendUrl}/api/articles?category=${EXPERIENCE_CATEGORY}&limit=50&sortBy=display_date&orderDirection=desc`;

  try {
    const response = await fetch(apiUrl, { next: { revalidate: 60 } });
    if (!response.ok) {
      return [];
    }

    const data: ArticlesResponse = await response.json();
    return data.items || [];
  } catch (error) {
    console.error('Failed to fetch experience articles:', error);
    return [];
  }
};

const getExcerpt = (article: Article) => {
  if (article.summary) {
    return article.summary;
  }

  return stripTags(article.content || '').slice(0, 90);
};

export default async function ExperiencePage({ searchParams }: ExperiencePageProps) {
  const resolvedSearchParams = await searchParams;
  const articles = await getExperienceArticles();
  const activeArticle = articles.find((article) => article.slug === resolvedSearchParams.slug) || articles[0] || null;
  const { html, headings } = buildContentWithToc(activeArticle?.content);

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#f7fbff_0%,#eefcf9_48%,#f6f0ff_100%)]">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[280px_minmax(0,1fr)_260px]">
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-2xl border border-white/80 bg-white/72 p-4 shadow-[0_18px_48px_rgba(15,23,42,0.08)] backdrop-blur-2xl">
            <div className="mb-4">
              <p className="text-sm font-medium text-sky-600">文档中心</p>
              <h1 className="mt-1 text-2xl font-bold text-slate-900">本站经验分享</h1>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                记录本站建设、AI 工具使用、内容整理和自动化工作流。
              </p>
            </div>

            <nav className="space-y-1">
              {articles.length > 0 ? (
                articles.map((article) => {
                  const active = activeArticle?.id === article.id;
                  return (
                    <Link key={article.id} href={`/experience?slug=${article.slug}`}>
                      <span
                        className={`block rounded-xl border px-3 py-2.5 text-sm transition ${
                          active
                            ? 'border-cyan-200 bg-cyan-50/85 text-sky-800 shadow-sm shadow-cyan-500/10'
                            : 'border-transparent text-slate-600 hover:border-white/80 hover:bg-white/80 hover:text-sky-700'
                        }`}
                      >
                        <span className="line-clamp-2 font-medium">{article.title}</span>
                        <span className="mt-1 block text-xs text-slate-400">
                          {new Date(article.display_date || article.created_at).toLocaleDateString('zh-CN')}
                        </span>
                      </span>
                    </Link>
                  );
                })
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 bg-white/60 px-3 py-4 text-sm text-slate-500">
                  还没有经验文档。
                </div>
              )}
            </nav>
          </div>
        </aside>

        <main className="min-w-0">
          <div className="rounded-2xl border border-white/80 bg-white/82 p-5 shadow-[0_18px_48px_rgba(15,23,42,0.08)] backdrop-blur-2xl md:p-8">
            {activeArticle ? (
              <>
                <div className="mb-6 border-b border-slate-100 pb-5">
                  <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-slate-400">
                    <Link href="/experience" className="font-medium text-sky-600 hover:text-sky-800">
                      本站经验分享
                    </Link>
                    <span>/</span>
                    <span className="line-clamp-1">{activeArticle.title}</span>
                  </div>
                  <h2 className="text-3xl font-bold leading-tight text-slate-950">{activeArticle.title}</h2>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
                    {getExcerpt(activeArticle)}
                  </p>
                </div>

                <article
                  className="prose prose-slate max-w-none prose-headings:scroll-mt-24 prose-headings:text-slate-900 prose-a:text-sky-700 prose-pre:rounded-xl prose-pre:bg-slate-950"
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              </>
            ) : (
              <div className="py-16 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-50 text-3xl">
                  📘
                </div>
                <h2 className="text-2xl font-bold text-slate-900">准备开始沉淀经验</h2>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
                  后台创建文章时选择“本站经验分享”分类，这里会自动变成类似文档中心的阅读页。
                </p>
                <Link
                  href="/admin/articles/new?category=site-experience"
                  className="mt-6 inline-flex rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-cyan-500/20"
                >
                  创建第一篇经验
                </Link>
              </div>
            )}
          </div>
        </main>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/80 bg-white/70 p-4 shadow-[0_18px_48px_rgba(15,23,42,0.07)] backdrop-blur-2xl">
              <h3 className="mb-3 text-sm font-bold text-slate-800">本文目录</h3>
              {headings.length > 0 ? (
                <nav className="space-y-1">
                  {headings.map((heading) => (
                    <a
                      key={heading.id}
                      href={`#${heading.id}`}
                      className={`block rounded-lg px-2 py-1.5 text-sm text-slate-500 transition hover:bg-white/80 hover:text-sky-700 ${
                        heading.level === 3 ? 'pl-5' : ''
                      }`}
                    >
                      {heading.text}
                    </a>
                  ))}
                </nav>
              ) : (
                <p className="text-sm leading-6 text-slate-400">正文里的二级/三级标题会自动生成目录。</p>
              )}
            </div>

            <div className="rounded-2xl border border-white/80 bg-white/70 p-4 shadow-[0_18px_48px_rgba(15,23,42,0.07)] backdrop-blur-2xl">
              <h3 className="mb-2 text-sm font-bold text-slate-800">管理员维护</h3>
              <p className="mb-3 text-sm leading-6 text-slate-500">
                用后台文章管理维护本页内容，分类选择“本站经验分享”。
              </p>
              <div className="flex flex-col gap-2">
                <Link href="/admin/articles?category=site-experience" className="rounded-xl border border-sky-100 bg-sky-50/75 px-3 py-2 text-sm font-medium text-sky-700 hover:bg-sky-100">
                  管理经验文章
                </Link>
                <Link href="/admin/articles/new?category=site-experience" className="rounded-xl border border-violet-100 bg-violet-50/75 px-3 py-2 text-sm font-medium text-violet-700 hover:bg-violet-100">
                  新建经验文章
                </Link>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
