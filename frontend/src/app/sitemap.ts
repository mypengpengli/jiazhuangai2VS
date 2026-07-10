import type { MetadataRoute } from 'next';

type SitemapArticle = { slug: string; updated_at?: string; display_date?: string | null };

const siteUrl = 'https://jiazhuangai.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: new Date(), changeFrequency: 'hourly', priority: 1 },
    { url: `${siteUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${siteUrl}/experience`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${siteUrl}/tools`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.5 },
  ];
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8787';
  try {
    const first = await fetch(`${backendUrl}/api/articles?limit=100&page=1&sortBy=updated_at&orderDirection=desc`, { next: { revalidate: 3600 } });
    if (!first.ok) return staticRoutes;
    const initial = await first.json() as { items?: SitemapArticle[]; total_pages?: number };
    const remainingPages = Math.max(0, Math.min(initial.total_pages || 1, 50) - 1);
    const pages = await Promise.all(Array.from({ length: remainingPages }, (_, index) => fetch(`${backendUrl}/api/articles?limit=100&page=${index + 2}&sortBy=updated_at&orderDirection=desc`, { next: { revalidate: 3600 } }).then((response) => response.ok ? response.json() : { items: [] })));
    const articles = [...(initial.items || []), ...pages.flatMap((page: { items?: SitemapArticle[] }) => page.items || [])];
    return [...staticRoutes, ...articles.map((article) => ({ url: `${siteUrl}/articles/${article.slug}`, lastModified: article.updated_at || article.display_date || new Date(), changeFrequency: 'weekly' as const, priority: 0.8 }))];
  } catch {
    return staticRoutes;
  }
}
