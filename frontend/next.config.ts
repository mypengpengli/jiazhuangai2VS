import type { NextConfig } from "next";
import path from 'path';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pub-3dc6a89ae11b4f2bb35597920365df2d.r2.dev',
        pathname: '/articles/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // 尝试直接为 problematic package 设置别名，指向 node_modules 中的路径
    // process.cwd() 在构建环境中通常是项目的根目录
    const nodeModulesPath = path.resolve(process.cwd(), 'node_modules');

    config.resolve.alias = {
      ...config.resolve.alias,
    };

    // 你可以根据需要为其他 @tiptap 包也添加类似的别名，如果它们也出现问题
    // 例如:
    // '@tiptap/core': path.join(nodeModulesPath, '@tiptap/core'),
    // '@tiptap/react': path.join(nodeModulesPath, '@tiptap/react'),
    // '@tiptap/starter-kit': path.join(nodeModulesPath, '@tiptap/starter-kit'),
    // '@tiptap/extension-image': path.join(nodeModulesPath, '@tiptap/extension-image'),
    // '@tiptap/extension-link': path.join(nodeModulesPath, '@tiptap/extension-link'),
    // '@tiptap/pm': path.join(nodeModulesPath, '@tiptap/pm'),

    return config;
  },
};

export default nextConfig;
