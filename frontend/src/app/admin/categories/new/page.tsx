'use client';

import React, { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

const CreateCategoryPage = () => {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState(''); // 新增 slug 状态
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();
  const router = useRouter();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) {
      setError('用户未认证');
      return;
    }
    if (!name || !slug) { // 同时检查 slug
      setError('分类名称和 Slug 不能为空');
      return;
    }
    // 简单的 slug 格式校验 (与后端 regex 匹配)
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(slug)) {
      setError('Slug 格式无效 (只能包含小写字母、数字和连字符)');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8787';
      const response = await fetch(`${backendUrl}/api/categories`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, slug, description }), // 添加 slug 到请求体
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: '创建分类失败' }));
        throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
      }

      alert('分类创建成功！');
      router.push('/admin/categories'); // 跳转回分类列表页
    } catch (err: unknown) {
      console.error('Failed to create category:', err);
      if (err instanceof Error) {
        setError(err.message || '创建分类时发生错误。');
      } else {
        setError('创建分类时发生未知错误。');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">创建新分类</h1>
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
          <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
            Slug (URL路径)
          </label>
          <input
            type="text"
            id="slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''))}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="例如: tech-news"
          />
          <p className="mt-1 text-xs text-gray-500">只能包含小写字母、数字和连字符 (-)。</p>
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
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isLoading ? '创建中...' : '创建分类'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateCategoryPage;