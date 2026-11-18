import SiteDocument, { metadata as siteMetadata, viewport as siteViewport } from '@/components/SiteDocument';

export const metadata = siteMetadata;
export const viewport = siteViewport;

export default function Layout({ children }: { children: React.ReactNode }) {
  return <SiteDocument locale="zh-CN">{children}</SiteDocument>;
}
