import Link from 'next/link';

export const metadata = { title: { absolute: 'Privacy Policy | Jiazhuang AI' }, alternates: { canonical: '/en/privacy', languages: { 'zh-CN': '/privacy', en: '/en/privacy' } } };

export default function Page() {
  return (
    <article className="page-shell py-8">
      <div className="mx-auto max-w-[var(--reading-max)]">
        <h1 className="text-3xl font-bold text-slate-950">Privacy Policy</h1>
        <p className="mt-3 text-sm text-slate-500">Effective July 10, 2026</p>
        <div className="content-prose mt-8">
          <h2>Information We Collect</h2>
          <p>We store your username, display name, and bio when you register, and the content and date of any comments you post. We collect your email address if you subscribe. The site also uses basic analytics and advertising services. A preference cookie remembers the language you select.</p>
          <h2>How We Use Information</h2>
          <p>We use this information for accounts, comments, subscriptions, site operations, and security. We do not sell personal information or use account data for unrelated marketing.</p>
          <h2>Third-Party Services</h2>
          <p>Google Analytics, Google AdSense, and Cloudflare may process technical information, cookies, or visit data under their own privacy policies.</p>
          <h2>Retention and Deletion</h2>
          <p>You can request that we correct or delete your account information, comments, or subscription data. We may retain necessary records for a reasonable period to address abuse or meet legal obligations.</p>
          <h2>Contact</h2>
          <p>For privacy questions, contact <a href="mailto:306100898@qq.com">306100898@qq.com</a>.</p>
        </div>
        <p className="mt-10 text-sm text-slate-500">By continuing to use the site you acknowledge this policy. See also the <Link href="/en/terms" className="text-brand hover:underline">Terms of Service</Link>.</p>
      </div>
    </article>
  );
}
