'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Category } from '@/types/models'; // 假设 Category 类型已定义
import { useEditor, EditorContent, Editor } from '@tiptap/react'; // Import Editor
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import LinkExtension from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align'; // 导入 TextAlign
import Color from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import dynamic from 'next/dynamic';
import MenuBar from '@/components/MenuBar';

const TiptapEditor = dynamic(() => import('@/components/Tiptap/TiptapEditor'), { ssr: false });
const FileUpload = dynamic(() => import('@/components/FileUpload'), { ssr: false });

interface ZodIssueSimple {
  path: (string | number)[];
  message: string;
}

// 定义附件类型，与后端 CreateArticleInput 中的 attachments 数组元素对应
interface AttachmentInput {
  file_url: string;
  file_type: string;
  filename?: string;
  description?: string;
  // 'key' is used internally by FileUpload's onUploadSuccess but not sent to backend directly in this structure
}

type UploadedAttachment = {
  key: string;
  file_type: string;
  file_url: string;
  filename?: string | null;
  description?: string | null;
  publicUrl?: string | null;
};

type AttachmentPayload = {
  file_type: string;
  file_url: string;
  filename?: string | null;
  description?: string | null;
  publicUrl?: string | null;
};

const CreateArticlePage = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [displayDate, setDisplayDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<string>('0');
  const [attachments, setAttachments] = useState<UploadedAttachment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8787';
        const response = await fetch(`${backendUrl}/api/categories`);
        if (!response.ok) {
          throw new Error('获取分类列表失败');
        }
        const data = await response.json();
        setCategories(data.items || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : '获取分类时发生未知错误');
      }
    };
    fetchCategories();
  }, []);

  const handleContentChange = (newContent: string, newHtmlContent: string) => {
    setContent(newContent);
    setHtmlContent(newHtmlContent);
  };

  const handleAttachmentUpload = (key: string, url: string, fileType: string, fileName?: string) => {
    setAttachments(prev => [...prev, { key, file_url: url, file_type: fileType, filename: fileName, publicUrl: url }]);
  };
  
  const handleRemoveAttachment = (keyToRemove: string) => {
    // Note: This only removes from the local state. 
    // You might need to call the backend to delete the file from R2 if it's already uploaded.
    setAttachments(prev => prev.filter(att => att.key !== keyToRemove));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (!title.trim()) {
      setError('文章标题不能为空。');
      return;
    }
    if (!token) {
      setError('用户未认证，无法创建文章。');
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8787';

      const dataToSend: {
        title: string;
        content: string;
        content_type: string;
        display_date: string | null;
        attachments: Omit<UploadedAttachment, 'key'>[];
        category_id?: number;
      } = {
        title,
        content: htmlContent,
        content_type: 'html',
        display_date: displayDate ? new Date(displayDate).toISOString() : null,
        attachments: attachments.map(({ key, ...rest }) => rest),
      };

      if (categoryId && categoryId !== '0') {
        dataToSend.category_id = parseInt(categoryId, 10);
      }
      
      const response = await fetch(`${backendUrl}/api/articles`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("创建文章失败，后端返回的原始数据:", JSON.stringify(errorData, null, 2));
        let detailedMessage = `HTTP error! status: ${response.status}`;
        if (errorData.message) {
            detailedMessage += ` - ${errorData.message}`;
        }
        throw new Error(detailedMessage);
      }

      const newArticle = await response.json();
      alert('文章创建成功！');
      router.push(`/admin/articles/edit/${newArticle.slug}`);

    } catch (err) {
      console.error('Failed to create article:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('创建文章时发生未知错误。');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">创建新文章</h1>
        <div className="flex justify-between items-center mb-6">
            <Link href="/admin/articles" className="text-blue-500 hover:underline">
                &larr; 返回文章列表
            </Link>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">标题</label>
                <input
                    type="text"
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    required
                />
            </div>
             <div>
                <label htmlFor="displayDate" className="block text-sm font-medium text-gray-700">显示日期</label>
                <input
                    type="date"
                    id="displayDate"
                    value={displayDate}
                    onChange={(e) => setDisplayDate(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    required
                />
            </div>
            <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700">分类</label>
                <select
                    id="category"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                    <option value="0">-- 请选择一个分类 --</option>
                    {categories.map((cat) => (
                        <option key={cat.id} value={cat.id.toString()}>
                            {cat.name}
                        </option>
                    ))}
                </select>
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-700">内容</label>
                <div className="mt-1">
                    <TiptapEditor
                        content={content}
                        onContentChange={handleContentChange}
                        token={token || ''}
                    />
                </div>
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-700">附件</label>
                <FileUpload 
                    onUploadComplete={handleAttachmentUpload}
                    onRemove={handleRemoveAttachment}
                    existingAttachments={attachments.map(att => ({ ...att, id: 0, article_id: 0, created_at: '' }))}
                />
            </div>

            {error && <div className="text-red-500 bg-red-100 p-3 rounded">{error}</div>}

            <div className="flex justify-end space-x-4">
                 <button
                    type="button"
                    onClick={() => router.back()}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded"
                    disabled={isLoading}
                >
                    取消
                </button>
                <button
                    type="submit"
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:bg-blue-300"
                    disabled={isLoading}
                >
                    {isLoading ? '正在创建...' : '创建文章'}
                </button>
            </div>
        </form>
    </div>
  );
};

export default CreateArticlePage;