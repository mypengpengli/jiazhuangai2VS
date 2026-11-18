import Link from 'next/link';

const sections = [
  ['内容说明', '本站发布的 AI 资讯、工具信息和经验文章用于信息交流与学习参考，不构成投资、法律、医疗或其他专业建议。使用第三方产品前，请自行核验其服务条款、价格与数据政策。'],
  ['账号与评论', '注册用户应妥善保管账号，不得发布违法、侵权、欺诈、骚扰、垃圾营销或恶意内容。评论会先进入审核，本站可隐藏或删除违反规则的内容。'],
  ['知识产权', '除另有说明外，本站原创内容受适用法律保护。引用第三方资料时应保留来源；未经许可不得大规模复制、抓取或再发布本站内容。'],
  ['服务调整', '我们可能更新、暂停或停止部分功能，也可能因安全、维护或第三方服务变化调整内容。'],
  ['联系我们', '如需反馈、举报或咨询，请发送邮件至 306100898@qq.com。'],
];

export default function TermsPage() {
  return <div className="page-shell py-8"><article className="mx-auto max-w-[var(--reading-max)]"><p className="text-sm font-semibold text-brand">网站规则</p><h1 className="mt-2 text-3xl font-bold text-slate-950">服务条款</h1><p className="mt-3 text-sm text-slate-500">生效日期：2026年7月10日</p><div className="content-prose mt-8">{sections.map(([title, content]) => <section key={title}><h2>{title}</h2><p>{content}</p></section>)}</div><p className="mt-10 text-sm text-slate-500">请同时阅读<Link href="/privacy" className="ml-1 text-brand hover:underline">隐私政策</Link>。</p></article></div>;
}
