import React from 'react';
import Link from 'next/link';
import SubscribeForm from './SubscribeForm';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 text-gray-300 mt-auto border-t border-purple-500/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* 品牌介绍 */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-3xl">🚀</span>
              <h3 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                加装AI助手
              </h3>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              为你加装最新AI能力。探索大语言模型、生图模型、视频模型等前沿技术，发现改变世界的AI工具与资讯。
            </p>
            {/* 社交媒体图标 */}
            <div className="flex gap-3">
              <a href="#" className="w-9 h-9 bg-white/10 hover:bg-cyan-500/30 rounded-lg flex items-center justify-center transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="#" className="w-9 h-9 bg-white/10 hover:bg-cyan-500/30 rounded-lg flex items-center justify-center transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
              </a>
              <a href="#" className="w-9 h-9 bg-white/10 hover:bg-cyan-500/30 rounded-lg flex items-center justify-center transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
              </a>
              <a href="#" className="w-9 h-9 bg-white/10 hover:bg-cyan-500/30 rounded-lg flex items-center justify-center transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
              </a>
            </div>
          </div>
          
          {/* AI模型分类 */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
              <span className="w-1 h-5 bg-gradient-to-b from-cyan-400 to-purple-400 rounded-full"></span>
              AI模型
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/articles?category=test" className="text-gray-400 hover:text-cyan-400 transition-colors flex items-center gap-2">💬 大语言模型</Link></li>
              <li><Link href="/articles?categories=s,thyroid-basics" className="text-gray-400 hover:text-cyan-400 transition-colors flex items-center gap-2">🎨 生图模型</Link></li>
              <li><Link href="/articles?category=video" className="text-gray-400 hover:text-cyan-400 transition-colors flex items-center gap-2">🎬 视频模型</Link></li>
              <li><Link href="/articles?categories=voice,music" className="text-gray-400 hover:text-cyan-400 transition-colors flex items-center gap-2">🎵 音频模型</Link></li>
            </ul>
          </div>
          
          {/* AI工具 */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
              <span className="w-1 h-5 bg-gradient-to-b from-cyan-400 to-purple-400 rounded-full"></span>
              AI工具
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/articles?categories=soft,locksoft" className="text-gray-400 hover:text-cyan-400 transition-colors flex items-center gap-2">⚡ AI软件工具</Link></li>
              <li><Link href="/articles?category=hardware" className="text-gray-400 hover:text-cyan-400 transition-colors flex items-center gap-2">🔧 AI硬件</Link></li>
              <li><Link href="/" className="text-gray-400 hover:text-cyan-400 transition-colors flex items-center gap-2">🔥 AI新鲜事</Link></li>
              <li><Link href="/about" className="text-gray-400 hover:text-cyan-400 transition-colors flex items-center gap-2">📖 关于我们</Link></li>
            </ul>
          </div>
          
          {/* 联系方式 */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
              <span className="w-1 h-5 bg-gradient-to-b from-cyan-400 to-purple-400 rounded-full"></span>
              联系我们
            </h4>
            <ul className="space-y-2.5 text-sm text-gray-400">
              <li className="flex items-center gap-2">
                <span className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">📧</span>
                contact@jiazhuangai.com
              </li>
              <li className="flex items-center gap-2">
                <span className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">🌐</span>
                www.jiazhuangai.com
              </li>
            </ul>
            {/* 订阅表单 */}
            <SubscribeForm />
          </div>
        </div>
        
        {/* 版权信息 */}
        <div className="border-t border-purple-500/30 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">
              &copy; {currentYear} 加装AI助手. 保留所有权利.
            </p>
            <div className="flex items-center gap-6 text-sm">
              <Link href="/privacy" className="text-gray-500 hover:text-cyan-400 transition-colors">隐私政策</Link>
              <Link href="/terms" className="text-gray-500 hover:text-cyan-400 transition-colors">服务条款</Link>
              <span className="text-cyan-500/70 flex items-center gap-1">
                Powered by AI <span className="animate-pulse">✨</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
