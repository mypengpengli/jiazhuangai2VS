import Link from 'next/link';

export default function Home() {
  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold mb-6 text-blue-700">
        欢迎来到甲状腺疾病科普平台
      </h1>
      <p className="text-lg mb-8 text-gray-700">
        我们致力于提供准确、易懂的甲状腺健康知识，帮助您更好地了解和管理相关疾病。
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
