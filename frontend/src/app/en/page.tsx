import type { Metadata } from 'next';
import HomePage from '@/components/pages/HomePage';

export const metadata: Metadata = {
  title: { absolute: 'Jiazhuang AI | AI News and Tools' },
  description: 'News on AI models, useful tools, and practical workflows.',
  alternates: { canonical: '/en', languages: { 'zh-CN': '/', en: '/en', 'x-default': '/' } },
  openGraph: { title: 'Jiazhuang AI | AI News and Tools', locale: 'en_US', url: '/en' },
  twitter: { card: 'summary', title: 'Jiazhuang AI | AI News and Tools', description: 'News on AI models, useful tools, and practical workflows.' },
};

export default function Page() {
  return <HomePage locale="en" />;
}
