'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import dynamic from 'next/dynamic';
import { Article, Category } from '@/types/models';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';

const TiptapEditor = dynamic(() => import('@/components/Tiptap/TiptapEditor'), { ssr: false });
const FileUpload = dynamic(() => import('@/components/FileUpload'), { ssr: false });

type UploadedAttachment = {
  id: number;
  key: string;
  file_type: string;
  file_url: string;
  filename?: string | null;
  description?: string | null;
  publicUrl?: string | null;
  created_at: string;
};

const EditArticlePage = () => {
  const [article, setArticle] = useState<Article | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [displayDate, setDisplayDate] = useState<string>('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<string>('0');
  const [attachments, setAttachments] = useState<UploadedAttachment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const fetchArticle = useCallback(async () => {
    if (!slug || !token) return;
    setIsLoading(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8787';
      const response = await fetch(`${backendUrl}/api/articles/${slug}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('文章加载失败');
      const data: Article = await response.json();
      setArticle(data);
      setTitle(data.title);
      setContent(data.content || '');
      setHtmlContent(data.content || '');
      setDisplayDate(data.display_date ? new Date(data.display_date).toISOString().split('T')[0] : '');
      setCategoryId(data.category_id?.toString() || '0');
      
      const fetchedAttachments = (data.attachments || []).map(att => ({
          ...att,
          key: att.file_url,
          publicUrl: att.file_url 
      }));
      setAttachments(fetchedAttachments);

    } catch (err) {
      setError(err instanceof Error ? err.message : '加载文章时发生未知错误');
    } finally {
      setIsLoading(false);
    }
  }, [slug, token]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8787';
        const response = await fetch(`${backendUrl}/api/categories`);
        if (!response.ok) throw new Error('获取分类列表失败');
        const data = await response.json();
        setCategories(data.items || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : '获取分类时发生未知错误');
      }
    };
    fetchCategories();
    fetchArticle();
  }, [fetchArticle]);

  const handleContentChange = (newContent: string, newHtmlContent: string) => {
    setContent(newContent);
    setHtmlContent(newHtmlContent);
  };

  const handleAttachmentUpload = (key: string, url: string, fileType: string, fileName?: string) => {
    const newAttachment: UploadedAttachment = {
        id: Date.now(), // Temporary ID for new uploads
        key,
        file_url: url,
        file_type: fileType,
        filename: fileName,
        publicUrl: url,
        created_at: new Date().toISOString()
    };
    setAttachments(prev => [...prev, newAttachment]);
  };

  const handleRemoveAttachment = (keyToRemove: string) => {
    setAttachments(prev => prev.filter(att => att.key !== keyToRemove));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !article) {
      setError('认证失败或文章未加载');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8787';
      const attachmentsPayload = attachments.map(att => ({
        file_url: att.file_url,
        file_type: att.file_type,
        filename: att.filename,
        description: att.description
      }));

      const response = await fetch(`${backendUrl}/api/articles/${article.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content: htmlContent,
          display_date: displayDate ? new Date(displayDate).toISOString() : null,
          category_id: categoryId !== '0' ? parseInt(categoryId, 10) : null,
          attachments: attachmentsPayload,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `更新失败，状态码: ${response.status}`);
      }

      alert('文章更新成功！');
      router.push('/admin/articles');
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新文章时发生未知错误。');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDelete = async () => {
    if (!article || !token || !window.confirm('确定要删除这篇文章吗？此操作无法撤销。')) {
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8787';
        const response = await fetch(`${backendUrl}/api/articles/${article.id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || '删除失败');
        }
        alert('文章已删除');
        router.push('/admin/articles');
    } catch (err) {
        setError(err instanceof Error ? err.message : '删除文章时发生错误');
    } finally {
        setIsLoading(false);
    }
  };

  const editor = useEditor({
    extensions: [
        StarterKit,
        Image.configure({
            inline: true,
            allowBase64: true,
        }),
        Link.configure({
            openOnClick: false,
            autolink: true,
        }),
        TextAlign.configure({
            types: ['heading', 'paragraph'],
        }),
    ],
    content: article ? article.content : '',
    editable: false,
  });

  useEffect(() => {
    if (article && editor && !editor.isDestroyed) {
      editor.commands.setContent(article.content);
    }
  }, [article, editor]);

  if (!article && !error) return <div>正在加载文章...</div>;
  if (error) return <div className="text-red-500 bg-red-100 p-4 rounded">{error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">编辑文章</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">标题</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
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
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm"
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
            <option value="0">-- 无分类 --</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id.toString()}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
        
        {token && (
            <>
                <div>
                    <label className="block text-sm font-medium text-gray-700">内容</label>
                    <EditorContent editor={editor} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">附件</label>
                    <FileUpload
                        onUploadComplete={handleAttachmentUpload}
                        onRemove={handleRemoveAttachment}
                        existingAttachments={attachments.map(att => ({ ...att, article_id: article?.id || 0 }))}
                        token={token}
                    />
                </div>
            </>
        )}


        {error && <div className="text-red-500 bg-red-100 p-3 rounded">{error}</div>}

        <div className="flex justify-between items-center mt-8">
            <button
                type="button"
                onClick={handleDelete}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded disabled:bg-red-300"
                disabled={isLoading}
            >
                {isLoading ? '处理中...' : '删除文章'}
            </button>
            <div className="flex space-x-4">
                <button
                    type="button"
                    onClick={() => router.push('/admin/articles')}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded"
                    disabled={isLoading}
                >
                    返回列表
                </button>
                <button
                    type="submit"
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:bg-blue-300"
                    disabled={isLoading}
                >
                    {isLoading ? '正在保存...' : '保存更改'}
                </button>
            </div>
        </div>
      </form>
    </div>
  );
};

export default EditArticlePage;