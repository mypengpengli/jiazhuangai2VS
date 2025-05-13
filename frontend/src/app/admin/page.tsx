import React from 'react';
import Link from 'next/link';

const AdminDashboardPage = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">管理员仪表盘</h1>
      <p className="mb-4">欢迎来到管理后台。</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Placeholder links for future admin sections */}
        <Link href="/admin/articles" className="block p-4 border rounded hover:bg-gray-100">
          文章管理
        </Link>
        <Link href="/admin/categories" className="block p-4 border rounded hover:bg-gray-100">
          分类管理
        </Link>
        {/* Add more links as needed */}
      </div>
    </div>
  );
};

export default AdminDashboardPage;