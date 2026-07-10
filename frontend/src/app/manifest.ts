import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '加装AI助手',
    short_name: '加装AI助手',
    description: 'AI 资讯、模型动态与实用工具导航。',
    start_url: '/',
    display: 'standalone',
    background_color: '#f5f7fa',
    theme_color: '#0284c7',
    lang: 'zh-CN',
    icons: [{ src: '/favicon.ico', sizes: 'any', type: 'image/x-icon' }],
  };
}
