import React from 'react';

export default function About() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* 页面标题 */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            关于我们
          </h1>
          <p className="text-xl text-gray-600">
            致力于AI技术普及和应用推广的创新团队
          </p>
        </div>

        {/* 团队使命 */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">我们的使命</h2>
          <p className="text-lg text-gray-700 leading-relaxed text-center">
            我们致力于成为连接AI技术与实际应用的桥梁，通过深入浅出的内容分享，
            帮助更多人了解人工智能的最新发展，发现AI技术在各个领域的无限可能。
          </p>
        </div>

        {/* 团队特色 */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
            <div className="text-4xl mb-4">🚀</div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">前沿视野</h3>
            <p className="text-gray-600">
              紧跟AI技术最新发展，第一时间分享行业前沿资讯，涵盖大语言模型、生图技术、视频生成等各个领域。
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">实用导向</h3>
            <p className="text-gray-600">
              专注于AI工具和技术的实际应用，提供详细的使用指南和最佳实践，帮助用户快速上手。
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
            <div className="text-4xl mb-4">📚</div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">深度解析</h3>
            <p className="text-gray-600">
              不仅介绍AI技术的表面功能，更深入剖析其工作原理和技术架构，满足不同层次用户的学习需求。
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
            <div className="text-4xl mb-4">🌐</div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">开放分享</h3>
            <p className="text-gray-600">
              建立开放的知识分享平台，汇聚AI领域的专业见解，促进技术交流与经验传递。
            </p>
          </div>
        </div>

        {/* 内容分类介绍 */}
        <div className="bg-gray-50 rounded-2xl p-8 mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">内容分类</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🤖</span>
              </div>
              <h3 className="font-bold text-gray-800 mb-2">大语言模型</h3>
              <p className="text-sm text-gray-600">GPT、Claude、文心一言等各大厂语言模型的深度解析</p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎨</span>
              </div>
              <h3 className="font-bold text-gray-800 mb-2">生图模型</h3>
              <p className="text-sm text-gray-600">Midjourney、DALL-E、Stable Diffusion等生图技术</p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎬</span>
              </div>
              <h3 className="font-bold text-gray-800 mb-2">视频模型</h3>
              <p className="text-sm text-gray-600">Sora、RunwayML等视频生成技术的前沿探索</p>
            </div>

            <div className="text-center">
              <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎵</span>
              </div>
              <h3 className="font-bold text-gray-800 mb-2">音频模型</h3>
              <p className="text-sm text-gray-600">语音合成、音乐生成等音频AI技术</p>
            </div>

            <div className="text-center">
              <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="font-bold text-gray-800 mb-2">AI硬件</h3>
              <p className="text-sm text-gray-600">GPU、TPU、AI芯片等硬件设备专业评测</p>
            </div>

            <div className="text-center">
              <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🛠️</span>
              </div>
              <h3 className="font-bold text-gray-800 mb-2">AI工具</h3>
              <p className="text-sm text-gray-600">实用AI软件工具的推荐与使用指南</p>
            </div>
          </div>
        </div>

        {/* 联系方式 */}
        <div className="text-center bg-gradient-to-r from-blue-600 to-purple-700 text-white rounded-2xl p-8">
          <h2 className="text-3xl font-bold mb-6">与我们联系</h2>
          <p className="text-lg mb-6">
            有任何建议、合作意向或技术问题，欢迎随时与我们联系
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <div className="flex items-center justify-center space-x-2">
              <span className="text-xl">📧</span>
              <span>contact@jiazhuang-ai.com</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <span className="text-xl">💬</span>
              <span>微信：AIHelper2024</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 