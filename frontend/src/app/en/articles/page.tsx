export const runtime = 'edge';

import ArticlesPage, { type ArticlesPageProps } from '@/components/pages/ArticlesPage';

export const metadata = { title: { absolute: 'AI News | Jiazhuang AI' } };

export default function Page(props: ArticlesPageProps) {
  return <ArticlesPage {...props} locale="en" />;
}
