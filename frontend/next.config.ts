import type { NextConfig } from "next";
import path from 'path'; // 导入 path 模块

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pub-3dc6a89ae11b4f2bb35597920365df2d.r2.dev', // 使用您提供的精确域名
        pathname: '/articles/**', // 允许 /articles/ 路径下的所有图片
      },
      // 如果您还从其他外部来源加载图片，也需要在这里添加相应的 pattern
    ],
  },
  /* 其他配置选项 */
  webpack: (config, { isServer, webpack: NextWebpack }) => {
    try {
      const basePath = process.cwd(); // 获取当前工作目录

      config.resolve.alias = {
        ...config.resolve.alias,
        '@tiptap/core': path.resolve(basePath, 'node_modules/@tiptap/core'),
        '@tiptap/pm': path.resolve(basePath, 'node_modules/@tiptap/pm'),
        '@tiptap/react': path.resolve(basePath, 'node_modules/@tiptap/react'),
        '@tiptap/starter-kit': path.resolve(basePath, 'node_modules/@tiptap/starter-kit'),
        '@tiptap/extension-image': path.resolve(basePath, 'node_modules/@tiptap/extension-image'),
        '@tiptap/extension-link': path.resolve(basePath, 'node_modules/@tiptap/extension-link'),
        '@tiptap/extension-text-align': path.resolve(basePath, 'node_modules/@tiptap/extension-text-align'),
      };
    } catch (e) {
      console.error("Error configuring webpack aliases for @tiptap extensions:", e);
    }
    return config;
  },
};

export default nextConfig;
