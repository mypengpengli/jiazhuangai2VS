import type { Metadata } from 'next';
import SiteDocument, { metadata as siteMetadata, viewport as siteViewport } from '@/components/SiteDocument';

export const metadata: Metadata = {
  ...siteMetadata,
  title: { default: 'Jiazhuang AI', template: '%s | Jiazhuang AI' },
  description: 'AI news, model releases, and practical field notes from Jiazhuang AI.',
  keywords: ['AI news', 'language models', 'image generation', 'AI tools', 'AI hardware'],
  openGraph: { type: 'website', locale: 'en_US', siteName: 'Jiazhuang AI' },
  twitter: { card: 'summary', title: 'Jiazhuang AI', description: 'AI news, model releases, and practical field notes.' },
};
export const viewport = siteViewport;

export default function Layout({ children }: { children: React.ReactNode }) {
  return <SiteDocument locale="en">{children}</SiteDocument>;
}
