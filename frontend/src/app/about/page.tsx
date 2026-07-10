import { BookOpenCheck, Compass, Mail, Rocket, ScanSearch } from 'lucide-react';

const principles = [
  { title: '前沿但不追热点', description: '优先解释真正影响使用方式、成本和工作流的变化。', icon: Compass },
  { title: '实用而可复用', description: '把工具、配置和步骤沉淀为可以直接执行的经验。', icon: Rocket },
  { title: '来源可追溯', description: '重要结论尽量标注原始发布、产品文档或相关资料。', icon: ScanSearch },
  { title: '持续整理', description: '将值得长期保存的内容归入本站经验分享文档中心。', icon: BookOpenCheck },
];

export default function AboutPage() {
  return <div className="page-shell py-7 sm:py-10"><section className="mx-auto max-w-3xl text-center"><p className="text-sm font-semibold text-brand">关于加装AI助手</p><h1 className="mt-2 text-3xl font-bold text-slate-950 sm:text-4xl">让 AI 信息更容易判断和使用</h1><p className="mt-4 text-base leading-7 text-slate-600">这里不只收集新闻，也尝试把模型、工具和实践过程整理成对实际工作有帮助的内容。</p></section><section className="mx-auto mt-10 max-w-5xl"><div className="surface-card p-6 sm:p-8"><h2 className="text-2xl font-bold text-slate-950">我们的方式</h2><p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">面对快速变化的 AI 行业，我们更关注变化本身意味着什么，哪些内容值得验证，哪些工具值得投入时间。资讯负责保持更新，经验文档负责保存可复用的方法。</p></div><div className="mt-4 grid gap-3 sm:grid-cols-2">{principles.map(({ icon: Icon, title, description }) => <article key={title} className="surface-card p-5"><Icon className="size-5 text-brand" /><h3 className="mt-4 text-lg font-semibold text-slate-900">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{description}</p></article>)}</div></section><section className="mx-auto mt-8 flex max-w-5xl flex-col justify-between gap-4 rounded-panel bg-slate-900 p-6 text-white sm:flex-row sm:items-center"><div><h2 className="text-lg font-semibold">联系与反馈</h2><p className="mt-1 text-sm text-slate-300">工具推荐、内容勘误和合作建议都可以发送邮件。</p></div><a href="mailto:306100898@qq.com" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-white px-4 text-sm font-medium text-slate-900 transition hover:bg-sky-50"><Mail className="size-4" />306100898@qq.com</a></section></div>;
}
