import Link from 'next/link';
import { Mail, Rocket } from 'lucide-react';
import SubscribeForm from './SubscribeForm';
import { footerNavigation } from '@/lib/navigation';
import { localizedPath, type Locale } from '@/lib/locale';

const Footer = ({ locale }: { locale: Locale }) => (
  <footer className="mt-12 border-t border-slate-200 bg-slate-950 text-slate-300">
    <div className="page-shell grid gap-8 py-10 md:grid-cols-[1.35fr_1fr_1fr]">
      <div>
        <div className="flex items-center gap-2 text-lg font-bold text-white"><Rocket className="size-5 text-sky-400" />{locale === 'en' ? 'Jiazhuang AI' : '加装AI助手'}</div>
        <p className="mt-3 max-w-sm text-sm leading-6 text-slate-400">{locale === 'en' ? 'AI news, model releases, and practical notes on the tools worth your time.' : '聚合值得阅读的 AI 资讯、模型动态和实用经验，帮助你快速判断新工具是否值得投入时间。'}</p>
        <a className="mt-4 inline-flex min-h-10 items-center gap-2 text-sm text-slate-300 transition hover:text-white" href="mailto:306100898@qq.com"><Mail className="size-4 text-sky-400" />306100898@qq.com</a>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-white">{locale === 'en' ? 'Explore' : '探索内容'}</h2>
        <nav className="mt-3 grid gap-2" aria-label={locale === 'en' ? 'Footer navigation' : '页脚导航'}>
          {footerNavigation.map(({ href, label, en }) => <Link key={href} href={localizedPath(href, locale)} className="text-sm text-slate-400 transition hover:text-sky-300">{locale === 'en' ? en : label}</Link>)}
          <Link href={localizedPath('/about', locale)} className="text-sm text-slate-400 transition hover:text-sky-300">{locale === 'en' ? 'About' : '关于我们'}</Link>
        </nav>
      </div>

      <div>
        <SubscribeForm locale={locale} />
      </div>
    </div>
    <div className="border-t border-white/10">
      <div className="page-shell flex flex-col gap-3 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <span>© {new Date().getFullYear()} {locale === 'en' ? 'Jiazhuang AI' : '加装AI助手'}</span>
        <div className="flex gap-4"><Link href={localizedPath('/privacy', locale)} className="hover:text-sky-300">{locale === 'en' ? 'Privacy' : '隐私政策'}</Link><Link href={localizedPath('/terms', locale)} className="hover:text-sky-300">{locale === 'en' ? 'Terms' : '服务条款'}</Link></div>
      </div>
    </div>
  </footer>
);

export default Footer;
