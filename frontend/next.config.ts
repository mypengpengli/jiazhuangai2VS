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
  webpack: (config, { isServer, webpack: NextWebpack }) => { // 添加 webpack 参数以访问 DefinePlugin
    // 为 @tiptap/extension-text-align 添加别名
    // __dirname 在 ESM 模块的 next.config.ts 中可能不直接可用，
    // 但 Next.js 的 webpack 函数上下文中的 config.context 通常是项目根目录。
    // 或者，更安全的方式是让 Node.js 的模块解析机制找到它。
    try {
      const tiptapTextAlignPath = require.resolve('@tiptap/extension-text-align');
      
      config.resolve.alias = {
        ...config.resolve.alias,
        '@tiptap/extension-text-align': tiptapTextAlignPath,
      };

      // 解决 Prosemirror 相关的 "Transformations order is invalid" 警告
      // https://github.com/ueberdosis/tiptap/issues/1451#issuecomment-1120822546
      // https://github.com/ProseMirror/prosemirror-transform/commit/05245415a0a97febba9081300658005110101d03
      // 通常这个问题在较新版本中已解决，但如果出现，可以尝试以下 DefinePlugin 配置
      // config.plugins.push(
      //   new NextWebpack.DefinePlugin({
      //     'process.env.PROSEMIRROR_REPLACE_INVALID_CHAR': JSON.stringify(false),
      //     'process.env.PROSEMIRROR_NO_DOM_COMPAT_APPENDTRANSACTION': JSON.stringify(false),
      //   })
      // );

    } catch (e) {
      console.error("Error configuring webpack alias for @tiptap/extension-text-align:", e);
      // 如果 require.resolve 失败，可以尝试回退到基于 __dirname 的路径，但这在 ESM 中可能不可靠
      // console.log("Falling back to path.resolve for @tiptap/extension-text-align alias");
      // config.resolve.alias = {
      //   ...config.resolve.alias,
      //   '@tiptap/extension-text-align': path.resolve(process.cwd(), 'node_modules/@tiptap/extension-text-align'),
      // };
    }
    return config;
  },
};

export default nextConfig;
