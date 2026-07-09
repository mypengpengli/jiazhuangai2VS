'use client';

export const runtime = 'edge';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import dynamic from 'next/dynamic';
import { Article, Category } from '@/types/models';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TiptapImage from '@tiptap/extension-image';
import TiptapLink from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Color from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import MenuBar from '@/components/MenuBar';
import {
  buildExperienceDocTree,
  collectDescendantIds,
  flattenExperienceDocTree,
  formatDocOptionLabel,
} from '@/lib/experienceDocs';

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
  const [parentId, setParentId] = useState<string>('0');
  const [experienceArticles, setExperienceArticles] = useState<Article[]>([]);
  const [attachments, setAttachments] = useState<UploadedAttachment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const selectedCategory = categories.find((cat) => cat.id.toString() === categoryId) || article?.category;
  const isExperienceArticle = selectedCategory?.slug === 'site-experience';
  const listHref = isExperienceArticle ? '/admin/articles?category=site-experience' : '/admin/articles';
  const experienceDocTree = buildExperienceDocTree(experienceArticles);
  const blockedParentIds = article
    ? new Set([article.id, ...collectDescendantIds(experienceDocTree, article.id)])
    : new Set<number>();
  const parentOptions = flattenExperienceDocTree(experienceDocTree).filter(
    (option) => !blockedParentIds.has(option.article.id)
  );

  const editor = useEditor({
    extensions: [
      StarterKit,
      TiptapImage.configure({ inline: true, allowBase64: true }),
      TiptapLink.configure({ openOnClick: false, autolink: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      Color,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: content,
    onUpdate: ({ editor }) => {
        const html = editor.getHTML();
        setHtmlContent(html);
        const json = editor.getJSON();
        setContent(JSON.stringify(json));
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl max-w-none focus:outline-none border border-gray-300 p-4 rounded-b-md min-h-[400px] bg-white',
        },
    }
  });

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
      if(editor && !editor.isDestroyed) {
        editor.commands.setContent(data.content || '');
      }
      setHtmlContent(data.content || '');
      setDisplayDate(data.display_date ? new Date(data.display_date).toISOString().split('T')[0] : '');
      setCategoryId(data.category_id?.toString() || '0');
      setParentId(data.parent_id?.toString() || '0');
      
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
  }, [slug, token, editor]);

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

  useEffect(() => {
    const fetchExperienceArticles = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8787';
        const response = await fetch(`${backendUrl}/api/articles?category=site-experience&limit=200&sortBy=display_date&orderDirection=desc`);
        if (!response.ok) {
          return;
        }
        const data = await response.json();
        setExperienceArticles(data.items || []);
      } catch (err) {
        console.error('获取经验文档列表失败:', err);
      }
    };

    fetchExperienceArticles();
  }, []);

  useEffect(() => {
    if (!isExperienceArticle) {
      setParentId('0');
    }
  }, [isExperienceArticle]);

  const handleAttachmentUpload = (attachment: { key: string; file_url: string; file_type: string; filename?: string; publicUrl?: string }) => {
    const newAttachment: UploadedAttachment = {
        id: Date.now(), // Temporary ID for new uploads
        ...attachment,
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

      const dataToSend: {
        title: string;
        content: string;
        display_date: string | null;
        category_id: number | null;
        parent_id: number | null;
        attachments: typeof attachmentsPayload;
      } = {
        title,
        content: htmlContent,
        display_date: displayDate ? new Date(displayDate).toISOString() : null,
        category_id: categoryId !== '0' ? parseInt(categoryId, 10) : null,
        parent_id: isExperienceArticle && parentId !== '0' ? parseInt(parentId, 10) : null,
        attachments: attachmentsPayload,
      };

      const response = await fetch(`${backendUrl}/api/articles/${article.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `更新失败，状态码: ${response.status}`);
      }

      alert('文章更新成功！');
      router.push(listHref);
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
        router.push(listHref);
    } catch (err) {
        setError(err instanceof Error ? err.message : '删除文章时发生错误');
    } finally {
        setIsLoading(false);
    }
  };


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

        {isExperienceArticle && (
          <div className="rounded-md border border-cyan-100 bg-cyan-50/60 p-4">
            <label htmlFor="parentDocument" className="block text-sm font-medium text-gray-700">父级文档</label>
            <select
              id="parentDocument"
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm rounded-md"
            >
              <option value="0">-- 作为一级文档 --</option>
              {parentOptions.map((option) => (
                  <option key={option.article.id} value={option.article.id.toString()}>
                    {formatDocOptionLabel(option.depth, option.article.title)}
                  </option>
                ))}
            </select>
            <p className="mt-2 text-xs text-slate-500">
              可以挂到任意层级下面。当前文档及其子文档不会出现在候选里，避免目录循环。
            </p>
          </div>
        )}

        {token && (
            <>
                <div>
                    <label className="block text-sm font-medium text-gray-700">内容</label>
                    <MenuBar editor={editor} />
                    <EditorContent editor={editor} />
                </div>
        <div>
                    <label className="block text-sm font-medium text-gray-700">附件上传</label>
                    {token && article && (
                        <FileUpload
                            onUploadSuccess={handleAttachmentUpload}
                            onUploadError={(e) => setError(`上传失败: ${e}`)}
                            directoryPrefix={`articles/${article.id}/`}
                        />
                    )}
        </div>

          {attachments.length > 0 && (
            <div className="mt-4">
              <h3 className="text-md font-medium text-gray-700">当前附件:</h3>
              <ul className="list-disc list-inside mt-2 space-y-1">
                         {attachments.map((att) => (
                           <li key={att.key} className="text-sm text-gray-600 flex justify-between items-center py-1">
                             <a href={att.publicUrl || '#'} target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-600">
                          {att.filename || att.key}
                        </a>
                        <button
                          type="button"
                                 onClick={() => handleRemoveAttachment(att.key)}
                                 className="ml-4 text-xs bg-red-200 hover:bg-red-300 text-red-700 px-2 py-1 rounded"
                      >
                        移除
                      </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
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
                    onClick={() => router.push(listHref)}
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
