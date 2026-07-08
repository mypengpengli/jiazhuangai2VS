import React from 'react';

const tools = [
  {
    name: 'OpenCowork',
    description: '轻量级 AI 工作助手，支持屏幕监控和可扩展的 Skills 系统。再也不会错过任何错误信息！',
    features: ['屏幕实时监控', 'Skills 工作流系统', '支持 OpenAI/Claude/Ollama', 'Tauri + Rust 高性能'],
    url: 'https://github.com/mypengpengli/OpenCowork',
    icon: '🤖',
    tags: ['开源', '免费', 'AI助手'],
    stars: 5,
  },
];

export default function ToolsPage() {
  return (
    <div className="space-y-6">
      <div className="max-w-6xl mx-auto">
        {/* 页面标题 */}
        <div className="mx-auto mb-6 max-w-3xl overflow-hidden rounded-xl border border-white/25 bg-slate-950/70 px-4 py-4 text-center shadow-[0_22px_70px_rgba(15,23,42,0.28)] backdrop-blur-2xl">
          <h1 className="text-xl sm:text-2xl font-bold mb-1 bg-gradient-to-r from-white via-cyan-100 to-violet-200 bg-clip-text text-transparent">
            🛠️ 推荐工具
          </h1>
          <p className="text-sm text-slate-200">
            精选实用的 AI 工具，提升你的工作效率
          </p>
        </div>

        {/* 工具卡片列表 */}
        <div className="grid md:grid-cols-2 gap-4">
          {tools.map((tool) => (
            <div
              key={tool.name}
              className="bg-white/85 rounded-2xl shadow-[0_10px_30px_rgba(15,23,42,0.06)] hover:shadow-xl hover:shadow-sky-500/12 transition-all duration-300 overflow-hidden border border-white/80 hover:border-sky-200/90 backdrop-blur-xl"
            >
              {/* 卡片头部 */}
              <div className="border-b border-white/70 bg-white/55 p-6">
                <div className="flex items-center gap-4">
                  <span className="text-5xl">{tool.icon}</span>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">{tool.name}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      {tool.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 bg-white/70 border border-sky-100 rounded-full text-xs text-sky-700"
                        >
                          {tag}
                        </span>
                      ))}
                      <span className="text-yellow-400 text-sm">⭐ {tool.stars}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 卡片内容 */}
              <div className="p-6">
                <p className="text-gray-600 mb-4">{tool.description}</p>
                
                {/* 功能列表 */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-500 mb-2">主要功能</h3>
                  <div className="flex flex-wrap gap-2">
                    {tool.features.map((feature) => (
                      <span
                        key={feature}
                          className="px-3 py-1 bg-white/70 border border-sky-100 text-sky-700 rounded-lg text-sm"
                      >
                        ✓ {feature}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 访问按钮 */}
                <a
                  href={tool.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center py-3 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 text-white font-medium rounded-xl transition-colors shadow-lg shadow-cyan-500/20"
                >
                  访问项目 →
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* 底部提示 */}
        <div className="mt-12 text-center">
          <p className="text-gray-500">
            有好用的 AI 工具想推荐？
            <a href="mailto:306100898@qq.com" className="text-purple-600 hover:underline ml-1">
              联系我们
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
