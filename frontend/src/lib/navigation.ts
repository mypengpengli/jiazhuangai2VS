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
  { label: '首页', href: '/', icon: Home },
  { label: '大语言模型', href: '/articles?category=test', icon: MessageSquareText },
  { label: '生图模型', href: '/articles?categories=s,thyroid-basics', icon: ImageIcon },
  { label: '视频模型', href: '/articles?category=video', icon: Bot },
  { label: '音频模型', href: '/articles?categories=voice,music', icon: Music2 },
  { label: 'AI硬件', href: '/articles?category=hardware', icon: Cpu },
  { label: 'AI工具', href: '/articles?categories=soft,locksoft', icon: Wrench },
  { label: '本站经验分享', href: '/experience', icon: NotebookTabs },
];

export const footerNavigation = [
  { label: 'AI 新鲜事', href: '/', icon: Lightbulb },
  ...primaryNavigation.slice(1),
];
