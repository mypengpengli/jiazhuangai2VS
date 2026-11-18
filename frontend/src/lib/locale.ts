export type Locale = 'zh-CN' | 'en';

export const LANGUAGE_COOKIE = 'site_language';

export function preferredLocale(header: string | null): Locale {
  const preferences = (header || '').split(',').flatMap((item) => {
    const [tag, ...parameters] = item.trim().toLowerCase().split(';');
    const language = tag.split('-')[0];
    const quality = parameters.map((value) => value.trim()).find((value) => value.startsWith('q='));
    const weight = quality ? Number(quality.slice(2)) : 1;
    return (language === 'zh' || language === 'en') && weight > 0 && weight <= 1
      ? [{ language, weight }]
      : [];
  });
  preferences.sort((a, b) => b.weight - a.weight);
  return preferences[0]?.language === 'zh' ? 'zh-CN' : 'en';
}

export const localizedPath = (path: string, locale: Locale = 'zh-CN') =>
  locale === 'en' ? (path === '/' ? '/en' : `/en${path}`) : path;

export const articlePath = (article: { slug: string; language?: Locale }) =>
  localizedPath(`/articles/${encodeURIComponent(article.slug)}`, article.language);

const englishCategories: Record<string, string> = {
  test: 'Language Models',
  'da-yu-yan-mo-xing': 'Language Models',
  s: '3D Generation',
  'thyroid-basics': 'Image Generation',
  video: 'Video Models',
  voice: 'Speech Models',
  music: 'Music Models',
  hardware: 'AI Hardware',
  soft: 'Open-source AI Tools',
  locksoft: 'Proprietary AI Tools',
  'ai-bian-wu': 'AI Choreography',
  'sheng-wu-mo-xing': 'Biology Models',
  'site-experience': 'Field Notes',
};

export function categoryLabel(category: { slug: string; name: string } | undefined, locale: Locale) {
  if (locale === 'en') return category ? englishCategories[category.slug] || 'AI News' : 'Uncategorized';
  return category?.name || '未分类';
}
