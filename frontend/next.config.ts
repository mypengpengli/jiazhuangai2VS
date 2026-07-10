import type { NextConfig } from 'next';

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
];

const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(),
  env: {
    NEXT_PUBLIC_BACKEND_API_URL: 'https://api.jiazhuangai.com',
    NEXT_PUBLIC_R2_PUBLIC_URL_PREFIX: 'https://pub-3dc6a89ae11b4f2bb35597920365df2d.r2.dev',
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'pub-3dc6a89ae11b4f2bb35597920365df2d.r2.dev', pathname: '/articles/**' }],
  },
};

export default nextConfig;
