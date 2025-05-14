'use client';

import React, { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Category } from '@/types/models'; // 假设 Category 类型已定义

const CreateArticlePage = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [imageFile, setImageFile] = useState<File | null>(null); // 仍然用于存储用户选择的文件
  const [uploadedFeatureImageKey, setUploadedFeatureImageKey] = useState<string | null>(null); // 新增：存储上传成功后的 R2 key
  const [isUploading, setIsUploading] = useState(false); // 新增：标记是否正在上传
  const [uploadError, setUploadError] = useState<string | null>(null); // 新增：存储上传错误信息
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false); // 这个 isLoading 用于文章提交，isUploading 用于文件上传
  const [error, setError] = useState<string | null>(null); // 这个 error 用于文章提交的错误
  const { token } = useAuth();
  const router = useRouter();

  // 获取分类列表用于下拉选择
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

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setImageFile(file); // 仍然设置，以便UI可以显示文件名或预览（如果需要）
      setUploadedFeatureImageKey(null); // 重置之前的上传结果
      setUploadError(null);
      setIsUploading(true);

      if (!token) {
        setUploadError('用户未认证，无法上传文件。');
        setIsUploading(false);
        return;
      }

      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8787';
        
        // 1. 获取预签名 URL
        const presignedUrlResponse = await fetch(`${backendUrl}/api/r2/presigned-url`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ fileName: file.name, contentType: file.type }),
        });

        if (!presignedUrlResponse.ok) {
          const errorData = await presignedUrlResponse.json().catch(() => ({ message: '获取预签名URL失败' }));
          throw new Error(errorData.message || `获取预签名URL失败: ${presignedUrlResponse.statusText}`);
        }

        const { uploadUrl, key } = await presignedUrlResponse.json();

        // 2. 上传文件到 R2
        const uploadResponse = await fetch(uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': file.type,
          },
          body: file,
        });

        if (!uploadResponse.ok) {
          // 尝试从 R2 获取错误信息 (R2 通常返回 XML 错误)
           const r2ErrorText = await uploadResponse.text();
           console.error('R2 Upload Error Text:', r2ErrorText);
          throw new Error(`文件上传到 R2 失败: ${uploadResponse.statusText}. R2 Response: ${r2ErrorText.substring(0, 200)}`);
        }

        setUploadedFeatureImageKey(key); // 保存 R2 返回的 key
        // 可以选择性地清除 imageFile 状态，或者保留它用于UI显示
        // setImageFile(null);
        alert('特色图片上传成功！');

      } catch (err: unknown) {
        console.error('File upload failed:', err);
        if (err instanceof Error) {
          setUploadError(err.message);
        } else {
          setUploadError('文件上传时发生未知错误。');
        }
      } finally {
        setIsUploading(false);
      }
    } else {
      setImageFile(null);
      setUploadedFeatureImageKey(null);
      setUploadError(null);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) {
      setError('用户未认证');
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
    // 准备提交给创建文章接口的数据
    const articleData: {
      title: string;
      content: string;
      category_id: number;
      feature_image_key?: string; // 可选的特色图片 key
    } = {
      title,
      content,
      category_id: Number(categoryId),
    };

    if (uploadedFeatureImageKey) {
      articleData.feature_image_key = uploadedFeatureImageKey;
    } else if (imageFile && !uploadedFeatureImageKey && !uploadError) {
      // 如果用户选择了文件，但由于某种原因（例如，在 handleSubmit 之前未完成上传）uploadedFeatureImageKey 未设置
      // 并且没有上传错误，提示用户等待或重新上传
      setError('特色图片正在处理或上传失败，请稍后或重新选择图片。');
      setIsLoading(false);
      return;
    }


    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8787';
      const response = await fetch(`${backendUrl}/api/articles`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json', // 修改为 JSON
        },
        body: JSON.stringify(articleData), // 发送 JSON 数据
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: '创建文章失败' }));
        throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
      }

      alert('文章创建成功！');
      router.push('/admin/articles'); // 跳转回文章列表页
    } catch (err: unknown) {
      console.error('Failed to create article:', err);
      if (err instanceof Error) {
        setError(err.message || '创建文章时发生错误。');
      } else {
        setError('创建文章时发生未知错误。');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">创建新文章</h1>
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
            特色图片 (可选)
          </label>
          <input
            type="file"
            id="image"
            accept="image/*"
            onChange={handleImageChange}
            disabled={isUploading} // 上传时禁用选择
            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {isUploading && <p className="text-sm text-blue-500 mt-1">图片上传中...</p>}
          {uploadError && <p className="text-sm text-red-500 mt-1">{uploadError}</p>}
          {uploadedFeatureImageKey && !isUploading && !uploadError && (
            <p className="text-sm text-green-500 mt-1">
              特色图片上传成功！Key: {uploadedFeatureImageKey.substring(0, 30) + (uploadedFeatureImageKey.length > 30 ? '...' : '')}
            </p>
          )}
        </div>
        
        {/* 文章提交错误 */}
        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div>
          <button
            type="submit"
            disabled={isLoading || isUploading} // 文章提交或图片上传时禁用
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isLoading ? '创建中...' : (isUploading ? '图片上传中...' : '创建文章')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateArticlePage;