import ArticlesPage, { type ArticlesPageProps } from '@/components/pages/ArticlesPage';

export default function Page(props: ArticlesPageProps) {
  return <ArticlesPage {...props} locale="zh-CN" />;
}
