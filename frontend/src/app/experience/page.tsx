export const runtime = 'edge';

import Link from 'next/link';
import { BookOpen, ChevronRight, ListTree, Wrench } from 'lucide-react';
import { Article } from '@/types/models';
import ExperienceDocTree from '@/components/ExperienceDocTree';
import ExperienceMobileNavigator from '@/components/ExperienceMobileNavigator';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { extractPlainText, prepareArticleHtml } from '@/lib/content';
import { buildExperienceDocTree, flattenExperienceDocTree } from '@/lib/experienceDocs';

const EXPERIENCE_CATEGORY = 'site-experience';
type ExperiencePageProps = { searchParams: Promise<{ slug?: string }> };

const getExperienceArticles = async (): Promise<Article[]> => {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8787';
  const response = await fetch(`${backendUrl}/api/articles?category=${EXPERIENCE_CATEGORY}&limit=200&sortBy=display_date&orderDirection=desc&includeContent=true`, { next: { revalidate: 60 } });
  if (!response.ok) return [];
  return ((await response.json()) as { items?: Article[] }).items || [];
};

const excerpt = (article: Article) => article.summary || extractPlainText(article.content).slice(0, 125);

export default async function ExperiencePage({ searchParams }: ExperiencePageProps) {
  const { slug } = await searchParams;
  const articles = await getExperienceArticles();
  const tree = buildExperienceDocTree(articles);
  const flattened = flattenExperienceDocTree(tree);
  const activeEntry = flattened.find((entry) => entry.article.slug === slug) || flattened[0] || null;
  const article = activeEntry?.article || null;
  const activePath = activeEntry?.path || [];
  const prepared = article?.content_type === 'html' ? await prepareArticleHtml(article.content, article.title) : null;

  return <div className="page-shell py-5 sm:py-7"><div className="mb-4"><ExperienceMobileNavigator nodes={tree} activeId={article?.id} activePathIds={activePath.map((node) => node.id)} /></div><div className="grid gap-6 lg:grid-cols-[250px_minmax(0,1fr)_220px]">
    <aside className="hidden lg:block lg:sticky lg:top-20 lg:self-start"><div className="surface-card p-4"><p className="text-sm font-semibold text-brand">文档中心</p><h1 className="mt-1 text-xl font-bold text-slate-950">本站经验分享</h1><p className="mt-2 text-sm leading-6 text-slate-500">记录网站建设、工具使用和可以复用的内容工作流。</p><div className="mt-5"><ExperienceDocTree nodes={tree} activeId={article?.id} activePathIds={activePath.map((node) => node.id)} /></div></div></aside>
    <main className="min-w-0"><article className="surface-card p-5 sm:p-8">{article ? <><nav className="flex flex-wrap items-center gap-1.5 text-sm text-slate-400" aria-label="文档路径"><Link href="/experience" className="font-medium text-brand hover:text-brand-strong">本站经验分享</Link>{activePath.map((node, index) => <span key={node.id} className="inline-flex min-w-0 items-center gap-1.5"><ChevronRight className="size-3.5 shrink-0" />{index === activePath.length - 1 ? <span className="truncate">{node.title}</span> : <Link href={`/experience?slug=${node.slug}`} className="hover:text-brand">{node.title}</Link>}</span>)}</nav><h2 className="mt-5 text-3xl font-bold leading-tight text-slate-950">{article.title}</h2><p className="mt-3 text-sm leading-6 text-slate-500">{excerpt(article)}</p><div className="mt-7 border-t border-slate-100 pt-1">{prepared?.html ? <div className="content-prose" dangerouslySetInnerHTML={{ __html: prepared.html }} /> : <div className="content-prose"><MarkdownRenderer content={article.content || ''} /></div>}</div></> : <div className="py-16 text-center"><BookOpen className="mx-auto size-10 text-sky-300" /><h2 className="mt-4 text-2xl font-bold text-slate-900">准备沉淀经验</h2><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">在后台新建文章时选择“本站经验分享”，即可把它维护成多级文档目录。</p><Link href="/admin/articles/new?category=site-experience" className="mt-6 inline-flex min-h-11 items-center rounded-control bg-brand px-4 text-sm font-medium text-white hover:bg-brand-strong">新建经验文档</Link></div>}</article></main>
    <aside className="hidden lg:block lg:sticky lg:top-20 lg:self-start"><div className="surface-card p-4"><div className="flex items-center gap-2"><ListTree className="size-4 text-brand" /><h2 className="text-sm font-semibold text-slate-900">本文目录</h2></div>{prepared?.headings.length ? <nav className="mt-3 grid gap-1">{prepared.headings.map((heading) => <a key={heading.id} href={`#${heading.id}`} className={`rounded-control px-2 py-1.5 text-sm text-slate-500 transition hover:bg-slate-50 hover:text-brand-strong ${heading.level === 3 ? 'pl-5' : ''}`}>{heading.text}</a>)}</nav> : <p className="mt-3 text-sm leading-6 text-slate-400">正文中的二级、三级标题会自动显示在这里。</p>}</div><div className="surface-card mt-4 p-4"><div className="flex items-center gap-2"><Wrench className="size-4 text-brand" /><h2 className="text-sm font-semibold text-slate-900">维护入口</h2></div><div className="mt-3 grid gap-2 text-sm"><Link href="/admin/articles?category=site-experience" className="rounded-control bg-sky-50 px-3 py-2 font-medium text-brand-strong hover:bg-sky-100">管理经验文档</Link><Link href="/admin/articles/new?category=site-experience" className="rounded-control bg-slate-50 px-3 py-2 font-medium text-slate-700 hover:bg-slate-100">新建经验文档</Link></div></div></aside>
  </div></div>;
}
