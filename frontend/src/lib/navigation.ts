import {
  Bot,
  Cpu,
  Home,
  Image as ImageIcon,
  Lightbulb,
  MessageSquareText,
  Music2,
  NotebookTabs,
  Wrench,
} from 'lucide-react';

export const primaryNavigation = [
  { label: '首页', en: 'Home', href: '/', icon: Home },
  { label: '大语言模型', en: 'LLMs', href: '/articles?category=test', icon: MessageSquareText },
  { label: '生图模型', en: 'Images', href: '/articles?categories=s,thyroid-basics', icon: ImageIcon },
  { label: '视频模型', en: 'Video', href: '/articles?category=video', icon: Bot },
  { label: '音频模型', en: 'Audio', href: '/articles?categories=voice,music', icon: Music2 },
  { label: 'AI硬件', en: 'Hardware', href: '/articles?category=hardware', icon: Cpu },
  { label: 'AI工具', en: 'Tools', href: '/articles?categories=soft,locksoft', icon: Wrench },
  { label: '本站经验分享', en: 'Field Notes', href: '/experience', icon: NotebookTabs },
];

export const footerNavigation = [
  { label: 'AI 新鲜事', en: 'AI News', href: '/', icon: Lightbulb },
  ...primaryNavigation.slice(1),
];
