import type { NextConfig } from "next";

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
};

export default nextConfig;
