import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    // './src/pages/**/*.{js,ts,jsx,tsx,mdx}', // Pages Router (我们使用 App Router)
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}', // App Router
  ],
  theme: {
    extend: {
      // 可以保留默认的渐变背景，或根据需要移除/修改
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      // 配置字体，使其与 layout.tsx 中定义的 CSS 变量匹配
      fontFamily: {
        sans: ['var(--font-geist-sans)'],
        mono: ['var(--font-geist-mono)'],
      },
    },
  },
  plugins: [],
};
export default config;