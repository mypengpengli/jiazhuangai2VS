import type { Metadata } from 'next';
import HomePage from '@/components/pages/HomePage';

export const metadata: Metadata = {
  alternates: { canonical: '/', languages: { 'zh-CN': '/', en: '/en', 'x-default': '/' } },
};

export default function Page() {
  return <HomePage locale="zh-CN" />;
}
