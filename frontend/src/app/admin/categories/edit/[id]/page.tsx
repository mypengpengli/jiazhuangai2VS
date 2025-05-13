'use client';
export const runtime = 'edge';

import React, { useState, useEffect, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Category } from '@/types/models';

const EditCategoryPage = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingCategory, setIsFetchingCategory] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();
  const router = useRouter();
  const params = useParams();
  const categoryId = params?.id as string; // Category ID from URL

  // 获取并填充分类数据
  useEffect(() => {
    if (!categoryId || !token) {
      setIsFetchingCategory(false);
      if (!token) setError("用户未认证");
      return;
    }

    const fetchCategoryData = async () => {
      setIsFetchingCategory(true);
      setError(null);
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8787';
        // 假设后端有 /api/categories/:id 的 GET 路由来获取单个分类
        const response = await fetch(`${backendUrl}/api/categories/${categoryId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) {
          if (response.status === 404) throw new Error('分类未找到');
          throw new Error('获取分类数据失败');
        }
        const category: Category = await response.json();
        setName(category.name);
        setDescription(category.description || '');
      } catch (err: unknown) {
        console.error('Failed to fetch category data:', err);
        if (err instanceof Error) {
          setError(err.message || '加载分类数据失败。');
        } else {
          setError('加载分类数据失败: 发生未知错误。');
        }
      } finally {
        setIsFetchingCategory(false);
      }
    };
    fetchCategoryData();
  }, [categoryId, token]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!token || !categoryId) {
      setError('用户未认证或分类 ID 无效');
      return;
    }
    if (!name) {
      setError('分类名称不能为空');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8787';
      const response = await fetch(`${backendUrl}/api/categories/${categoryId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, description }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: '更新分类失败' }));
        throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
      }

      alert('分类更新成功！');
      router.push('/admin/categories');
    } catch (err: unknown) {
      console.error('Failed to update category:', err);
      if (err instanceof Error) {
        setError(err.message || '更新分类时发生错误。');
      } else {
        setError('更新分类时发生未知错误。');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetchingCategory) {
    return <div className="text-center py-10">加载分类数据中...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">编辑分类 (ID: {categoryId})</h1>
        <Link href="/admin/categories" className="text-blue-500 hover:underline">
          &larr; 返回分类列表
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded shadow">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            分类名称
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            描述 (可选)
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div>
          <button
            type="submit"
            disabled={isLoading || isFetchingCategory}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isLoading ? '更新中...' : '更新分类'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditCategoryPage;