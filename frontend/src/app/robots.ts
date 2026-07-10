import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/' }, { userAgent: 'Mediapartners-Google', allow: '/' }],
    sitemap: 'https://jiazhuangai.com/sitemap.xml',
  };
}
