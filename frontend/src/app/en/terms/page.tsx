import Link from 'next/link';

export const metadata = { title: { absolute: 'Terms of Service | Jiazhuang AI' }, alternates: { canonical: '/en/terms', languages: { 'zh-CN': '/terms', en: '/en/terms' } } };

export default function Page() {
  return (
    <article className="page-shell py-8">
      <div className="mx-auto max-w-[var(--reading-max)]">
        <h1 className="text-3xl font-bold text-slate-950">Terms of Service</h1>
        <p className="mt-3 text-sm text-slate-500">Effective July 10, 2026</p>
        <div className="content-prose mt-8">
          <h2>Use of Content</h2>
          <p>Our news, tool coverage, and guides are for information and learning. They do not constitute investment, legal, medical, or other professional advice. Review third-party terms, pricing, and data policies before using a product.</p>
          <h2>Accounts and Comments</h2>
          <p>Protect your account and avoid unlawful, infringing, fraudulent, harassing, promotional spam, or malicious content. Comments are reviewed before publication, and we may hide or delete content that violates these rules.</p>
          <h2>Intellectual Property</h2>
          <p>Unless stated otherwise, applicable law protects our original content. Credit third-party sources when quoting them. Large-scale copying, scraping, or republication of our content requires permission.</p>
          <h2>Changes to the Service</h2>
          <p>We may update, pause, or discontinue features, and adjust content in response to maintenance, security, or changes in third-party services.</p>
          <h2>Contact</h2>
          <p>Send feedback, reports, and inquiries to <a href="mailto:306100898@qq.com">306100898@qq.com</a>.</p>
        </div>
        <p className="mt-10 text-sm text-slate-500">See also the <Link href="/en/privacy" className="text-brand hover:underline">Privacy Policy</Link>.</p>
      </div>
    </article>
  );
}
