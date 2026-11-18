import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, CalendarDays, ChevronRight, FolderOpen } from 'lucide-react';
import { notFound, permanentRedirect } from 'next/navigation';
import CommentSection from '@/components/CommentSection';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import ReadingProgress from '@/components/ReadingProgress';
import ViewCounter from '@/components/ViewCounter';
import { extractPlainText, normalizeMarkdownContent, prepareArticleHtml } from '@/lib/content';
import { formatArticleDate } from '@/lib/formatters';
import { resolveMediaUrl } from '@/lib/media';
import { Article } from '@/types/models';
import { articlePath, categoryLabel, localizedPath, type Locale } from '@/lib/locale';
import LanguageLink from '@/components/LanguageLink';

export interface ArticleDetailPageProps {
  params: Promise<{ slug: string }>;
}

const getArticleData = async (slug: string): Promise<Article | null> => {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8787';
  const response = await fetch(`${backendUrl}/api/articles/${encodeURIComponent(slug)}`, { next: { revalidate: 60 } });
  if (response.status === 404 || !response.ok) return null;
  return response.json() as Promise<Article>;
};

const extractDescription = (content?: string, maxLength = 155) => extractPlainText(content).slice(0, maxLength);

export async function articleMetadata({ params }: ArticleDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleData(slug);
  if (!article) return { title: '文章未找到' };
  const locale = article.language ?? 'zh-CN';
  const en = locale === 'en';
  const description = extractDescription(article.content) || (en ? 'AI news and practical guides from Jiazhuang AI.' : '加装AI助手的 AI 资讯与实践内容。');
  const image = resolveMediaUrl(article.cover_image);
  const canonical = articlePath(article);
  const languages = Object.fromEntries([[locale, canonical], ...(article.translations ?? []).map((version) => [version.language, articlePath(version)])]);
  return {
    title: en ? { absolute: `${article.title} | Jiazhuang AI` } : article.title,
    description,
    alternates: { canonical, languages },
    openGraph: { type: 'article', title: article.title, description, url: canonical, locale: en ? 'en_US' : 'zh_CN', siteName: en ? 'Jiazhuang AI' : '加装AI助手', images: image ? [{ url: image }] : undefined },
    twitter: { card: image ? 'summary_large_image' : 'summary', title: article.title, description, images: image ? [image] : undefined },
  };
}

export default async function ArticleDetailPage({ params, locale }: ArticleDetailPageProps & { locale: Locale }) {
  const { slug } = await params;
  const article = await getArticleData(slug);
  if (!article) notFound();
  if ((article.language ?? 'zh-CN') !== locale) permanentRedirect(articlePath(article));

  const en = locale === 'en';
  const categoryName = categoryLabel(article.category, locale);
  const categoryHref = localizedPath(article.category?.slug ? `/articles?category=${encodeURIComponent(article.category.slug)}` : '/articles', locale);
  const homeHref = localizedPath('/', locale);
  const alternate = article.translations?.find((version) => version.language !== locale);
  const displayDate = article.display_date || article.created_at;
  const preparedHtml = article.content_type === 'html' ? await prepareArticleHtml(article.content, article.title) : null;
  const markdown = article.content_type === 'html' ? '' : normalizeMarkdownContent(article.content, article.title);
  const image = resolveMediaUrl(article.cover_image);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    datePublished: article.created_at,
    dateModified: article.updated_at || article.created_at,
    inLanguage: locale,
    mainEntityOfPage: `https://jiazhuangai.com${articlePath(article)}`,
    author: { '@type': 'Organization', name: '加装AI助手', url: 'https://jiazhuangai.com/about' },
    publisher: { '@type': 'Organization', name: '加装AI助手', url: 'https://jiazhuangai.com' },
    ...(image ? { image: [image] } : {}),
  };

  return (
    <div className="page-shell py-5 sm:py-8">
      <ReadingProgress />
      <nav className="mx-auto mb-5 flex max-w-[var(--reading-max)] items-center gap-1.5 overflow-hidden whitespace-nowrap text-sm text-slate-500" aria-label={en ? 'Breadcrumb' : '面包屑'}>
        <Link href={homeHref} className="hover:text-brand-strong">{en ? 'Home' : '首页'}</Link><ChevronRight className="size-3.5 shrink-0" /><Link href={categoryHref} className="hover:text-brand-strong">{categoryName}</Link><ChevronRight className="size-3.5 shrink-0" /><span className="truncate text-slate-400">{article.title}</span>
      </nav>

      <article className="mx-auto max-w-[var(--reading-max)]">
        <header className="border-b border-slate-200 pb-7">
          <Link href={categoryHref} className="inline-flex min-h-8 items-center gap-1.5 rounded-full bg-sky-50 px-2.5 text-xs font-semibold text-brand-strong transition hover:bg-sky-100"><FolderOpen className="size-3.5" />{categoryName}</Link>
          <h1 className="mt-4 break-words text-[2rem] font-bold leading-[1.25] text-slate-950 sm:text-[2.65rem]">{article.title}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
            <span className="inline-flex items-center gap-1.5"><CalendarDays className="size-4" />{formatArticleDate(displayDate, locale)}</span>
            <ViewCounter slug={article.slug} initialCount={article.view_count ?? 0} locale={locale} />
            {alternate && <LanguageLink href={articlePath(alternate)} locale={alternate.language} lang={alternate.language} className="font-medium text-brand-strong hover:underline">{en ? '阅读中文原文' : 'Read in English'}</LanguageLink>}
          </div>
        </header>

        {image && <img src={image} alt="" className="mt-7 aspect-[16/8] w-full rounded-panel border border-slate-200 object-cover" />}
        {preparedHtml?.html ? <div className="content-prose mt-7" dangerouslySetInnerHTML={{ __html: preparedHtml.html }} /> : markdown ? <div className="content-prose mt-7"><MarkdownRenderer content={markdown} /></div> : <p className="mt-7 text-slate-500">{en ? 'No article content.' : '文章内容暂未填写。'}</p>}

        <footer className="mt-10 flex flex-wrap gap-3 border-t border-slate-200 pt-5">
          <Link href={homeHref} className="inline-flex min-h-11 items-center gap-2 rounded-control border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"><ArrowLeft className="size-4" />{en ? 'Back to Home' : '返回首页'}</Link>
          <Link href={categoryHref} className="inline-flex min-h-11 items-center gap-2 rounded-control bg-brand px-4 text-sm font-medium text-white transition hover:bg-brand-strong">{en ? `More in ${categoryName}` : `更多${categoryName}`}<ArrowRight className="size-4" /></Link>
        </footer>
      </article>

      <div className="mx-auto max-w-[var(--reading-max)]"><CommentSection articleSlug={article.slug} locale={locale} /></div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
    </div>
  );
}
