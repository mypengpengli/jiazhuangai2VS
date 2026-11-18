import { Mail } from 'lucide-react';

export const metadata = { title: { absolute: 'About | Jiazhuang AI' }, alternates: { canonical: '/en/about', languages: { 'zh-CN': '/about', en: '/en/about' } } };

export default function Page() {
  return (
    <article className="page-shell py-8">
      <div className="mx-auto max-w-[var(--reading-max)]">
        <h1 className="text-3xl font-bold text-slate-950">About Jiazhuang AI</h1>
        <div className="content-prose mt-6">
          <p>Jiazhuang AI covers model releases, tools, and practical workflows. We focus on what each change means for day-to-day use, including cost, deployment, and trade-offs.</p>
          <h2>How we cover AI</h2>
          <p>We link to original announcements, documentation, and research where possible. Our news coverage follows new developments, while Field Notes collects practical methods worth keeping.</p>
          <h2>Contact</h2>
          <p>Send tool recommendations, corrections, and partnership inquiries by email.</p>
          <a href="mailto:306100898@qq.com" className="inline-flex items-center gap-2"><Mail className="size-4" />306100898@qq.com</a>
        </div>
      </div>
    </article>
  );
}
