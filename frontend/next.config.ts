import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.r2.dev', // 允许所有 r2.dev 的子域名
        // 如果您的 NEXT_PUBLIC_R2_PUBLIC_URL_PREFIX 是一个特定的域名，
        // 例如 'pub-yourbucketid.r2.dev'，可以将其替换掉上面的 '**.r2.dev'
        // pathname: '/your-bucket-path/**', // 如果有特定路径，也可以配置
      },
      // 如果您还从其他外部来源加载图片，也需要在这里添加相应的 pattern
    ],
  },
  /* 其他配置选项 */
};

export default nextConfig;
