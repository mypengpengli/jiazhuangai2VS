import Link from 'next/link';

const sections = [
  ['我们收集的信息', '当你注册时，我们会保存登录名、显示昵称和个人简介；当你发表评论时，我们会保存评论内容和发布时间；订阅资讯时，我们会保存邮箱地址。网站还会使用基础访问统计与广告服务。'],
  ['信息如何使用', '这些信息仅用于提供账号、评论、订阅、网站运营和安全防护服务。我们不会出售你的个人信息，也不会将账号资料用于与本站无关的营销。'],
  ['第三方服务', '本站使用 Google Analytics、Google AdSense 与 Cloudflare 等服务。它们可能根据自己的隐私政策处理必要的技术信息、Cookie 或访问数据。'],
  ['保存与删除', '你可以通过联系邮箱申请更正或删除账号资料、评论和订阅信息。为处理滥用和法律义务，必要记录可能在合理期限内保留。'],
  ['联系我们', '如对隐私处理有疑问，请发送邮件至 306100898@qq.com。'],
];

export default function PrivacyPage() {
  return <div className="page-shell py-8"><article className="mx-auto max-w-[var(--reading-max)]"><p className="text-sm font-semibold text-brand">法律与隐私</p><h1 className="mt-2 text-3xl font-bold text-slate-950">隐私政策</h1><p className="mt-3 text-sm text-slate-500">生效日期：2026年7月10日</p><div className="content-prose mt-8">{sections.map(([title, content]) => <section key={title}><h2>{title}</h2><p>{content}</p></section>)}</div><p className="mt-10 text-sm text-slate-500">继续使用本站即表示你理解本政策。也可阅读<Link href="/terms" className="ml-1 text-brand hover:underline">服务条款</Link>。</p></article></div>;
}
