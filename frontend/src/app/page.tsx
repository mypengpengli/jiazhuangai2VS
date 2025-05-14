import Link from 'next/link';

export default function Home() {
  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold mb-6 text-blue-700">
        欢迎来到家装AI助手
      </h1>
      <p className="text-lg mb-8 text-gray-700">
        家装AI助手，提供智能家装设计、方案推荐和行业资讯。
      </p>
      <div className="space-x-4">
        <Link
          href="/articles"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300"
        >
          浏览科普文章
        </Link>
        <Link
          href="/categories"
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 px-6 rounded-lg transition duration-300"
        >
          查看文章分类
        </Link>
      </div>
      {/* 可以添加更多内容，例如特色文章、最新资讯等 */}
    </div>
  );
}
