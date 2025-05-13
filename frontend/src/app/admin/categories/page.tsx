'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Category } from '@/types/models';
import { useAuth } from '@/context/AuthContext';

const AdminCategoriesPage = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    const fetchCategories = async () => {
      if (!token) {
        setError('用户未认证，无法加载分类。');
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8787';
        const response = await fetch(`${backendUrl}/api/categories`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: '获取分类列表失败' }));
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setCategories(data || []); // API 直接返回数组
      } catch (err: any) {
        console.error('Failed to fetch categories:', err);
        setError(err.message || '加载分类失败，请稍后重试。');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, [token]);

  const handleDeleteCategory = async (categoryId: number) => {
    if (!token) {
        alert('认证无效，无法删除。');
        return;
    }
    if (window.confirm('确定要删除这个分类吗？如果分类下有文章，可能需要先处理这些文章。')) {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8787';
        const response = await fetch(`${backendUrl}/api/categories/${categoryId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: '删除失败' }));
          throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
        }
        setCategories(prevCategories => prevCategories.filter(category => category.id !== categoryId));
        alert('分类删除成功！');
      } catch (err: any) {
        console.error('Failed to delete category:', err);
        alert(`删除分类失败: ${err.message}`);
      }
    }
  };

  if (isLoading) {
    return <div className="text-center py-10">加载分类列表中...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">错误: {error}</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">分类管理</h1>
        <Link href="/admin/categories/new" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          创建新分类
        </Link>
      </div>

      {categories.length === 0 ? (
        <p>暂无分类。</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-2 px-4 border-b text-left">ID</th>
                <th className="py-2 px-4 border-b text-left">名称</th>
                <th className="py-2 px-4 border-b text-left">Slug</th>
                <th className="py-2 px-4 border-b text-left">描述</th>
                <th className="py-2 px-4 border-b text-left">操作</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border-b">{category.id}</td>
                  <td className="py-2 px-4 border-b">{category.name}</td>
                  <td className="py-2 px-4 border-b">{category.slug}</td>
                  <td className="py-2 px-4 border-b truncate max-w-xs">{category.description || '-'}</td>
                  <td className="py-2 px-4 border-b">
                    <Link href={`/admin/categories/edit/${category.id}`} className="text-yellow-600 hover:underline mr-2">
                      编辑
                    </Link>
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      className="text-red-600 hover:underline"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminCategoriesPage;