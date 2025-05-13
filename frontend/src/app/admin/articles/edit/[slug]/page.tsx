'use client';

import React, { useState, useEffect, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image'; // Import next/image
import { useAuth } from '@/context/AuthContext';
import { Category, Article } from '@/types/models';

const EditArticlePage = () => {
  const [articleIdForUpdate, setArticleIdForUpdate] = useState<number | null>(null); // To store the ID for PUT request
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null | undefined>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingArticle, setIsFetchingArticle] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();
  const router = useRouter();
  const params = useParams();
  const articleSlug = params?.slug as string; // Article SLUG from URL

  // 获取分类列表
  useEffect(() => {
    const fetchCategories = async () => {
      if (!token) return;
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8787';
        const response = await fetch(`${backendUrl}/api/categories`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('获取分类失败');
        const data = await response.json();
        setCategories(data || []);
      } catch (err: unknown) {
        console.error('Failed to fetch categories:', err);
        if (err instanceof Error) {
          setError('加载分类列表失败: ' + err.message);
        } else {
          setError('加载分类列表失败: 发生未知错误');
        }
      }
    };
    fetchCategories();
  }, [token]);

  // 获取并填充文章数据
  useEffect(() => {
    if (!articleSlug || !token) {
        setIsFetchingArticle(false);
        if (!token) setError("用户未认证");
        return;
    };

    const fetchArticleData = async () => {
      setIsFetchingArticle(true);
      setError(null);
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8787';
        const response = await fetch(`${backendUrl}/api/articles/${articleSlug}`, { // Fetch by SLUG
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) {
          if (response.status === 404) throw new Error('文章未找到');
          throw new Error('获取文章数据失败');
        }
        const article: Article = await response.json();
        setArticleIdForUpdate(article.id); // Store the ID for the PUT request
        setTitle(article.title);
        setContent(article.content || '');
        setCategoryId(article.category_id || '');
        setCurrentImageUrl(article.image_urls);
      } catch (err: unknown) {
        console.error('Failed to fetch article data:', err);
        if (err instanceof Error) {
          setError(err.message || '加载文章数据失败。');
        } else {
          setError('加载文章数据失败: 发生未知错误。');
        }
      } finally {
        setIsFetchingArticle(false);
      }
    };
    fetchArticleData();
  }, [articleSlug, token]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setImageFile(event.target.files[0]);
      setCurrentImageUrl(null);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!token || !articleIdForUpdate) { // Check for articleIdForUpdate for the PUT request
      setError('用户未认证或文章 ID 无效');
      return;
    }
     if (!title || !content || !categoryId) {
      setError('标题、内容和分类不能为空');
      return;
    }

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    formData.append('category_id', String(categoryId));
    if (imageFile) {
      formData.append('image', imageFile);
    }

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8787';
      const response = await fetch(`${backendUrl}/api/articles/${articleIdForUpdate}`, { // PUT request to /api/articles/:id
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: '更新文章失败' }));
        throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
      }

      alert('文章更新成功！');
      router.push('/admin/articles');
    } catch (err: unknown) {
      console.error('Failed to update article:', err);
      if (err instanceof Error) {
        setError(err.message || '更新文章时发生错误。');
      } else {
        setError('更新文章时发生未知错误。');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetchingArticle) {
    return <div className="text-center py-10">加载文章数据中...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">编辑文章 (Slug: {articleSlug})</h1>
        <Link href="/admin/articles" className="text-blue-500 hover:underline">
          &larr; 返回文章列表
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded shadow">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            标题
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700">
            内容 (支持 Markdown)
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={10}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">
            分类
          </label>
          <select
            id="category"
            value={categoryId}
            onChange={(e) => setCategoryId(Number(e.target.value))}
            required
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="" disabled>请选择一个分类</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="image" className="block text-sm font-medium text-gray-700">
            特色图片
          </label>
          {currentImageUrl && !imageFile && (
            <div className="my-2">
              <p className="text-xs text-gray-600 mb-1">当前图片:</p>
              {/* 使用 next/image。注意：如果 currentImageUrl 是外部 URL，需要在 next.config.js 中配置 images.remotePatterns */}
              {/* 为了简单起见，这里假设图片尺寸，实际应用中可能需要更动态的处理或固定宽高比 */}
              <Image src={currentImageUrl} alt="Current article image" width={160} height={160} className="max-h-40 w-auto rounded border" style={{ objectFit: 'contain' }} />
            </div>
          )}
          <input
            type="file"
            id="image"
            accept="image/*"
            onChange={handleImageChange}
            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          />
           <p className="text-xs text-gray-500 mt-1">选择新图片将会替换当前图片。</p>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div>
          <button
            type="submit"
            disabled={isLoading || isFetchingArticle}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isLoading ? '更新中...' : '更新文章'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditArticlePage;