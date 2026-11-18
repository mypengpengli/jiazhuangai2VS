export const runtime = 'edge';

import ArticleDetailPage, { articleMetadata, type ArticleDetailPageProps } from '@/components/pages/ArticleDetailPage';

export const generateMetadata = articleMetadata;

export default function Page(props: ArticleDetailPageProps) {
  return <ArticleDetailPage {...props} locale="en" />;
}
