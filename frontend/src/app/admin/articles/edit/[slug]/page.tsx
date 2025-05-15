'use client';
export const runtime = 'edge';

import React, { useState, useEffect, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
// import Image from 'next/image'; // next/image might still be useful for displaying uploaded images
import { useAuth } from '@/context/AuthContext';
import { Category, Article, ArticleAttachment } from '@/types/models'; // ArticleAttachment might be needed if we fetch full attachment details
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TiptapImage from '@tiptap/extension-image'; // Renamed to avoid conflict
import TiptapLink from '@tiptap/extension-link';   // Renamed to avoid conflict
import FileUpload from '../../../../../components/FileUpload'; // Corrected relative path

// Define attachment types similar to CreateArticlePage
interface AttachmentInput {
  file_url: string;
  file_type: string;
  filename?: string;
  description?: string;
}
interface UploadedAttachment extends AttachmentInput {
  key: string;
  id?: number; // Existing attachments will have an ID
}

const EditArticlePage = () => {
  const [articleIdForUpdate, setArticleIdForUpdate] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  // content will be managed by Tiptap editor
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [attachments, setAttachments] = useState<UploadedAttachment[]>([]);
  const [attachmentUploadError, setAttachmentUploadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingArticle, setIsFetchingArticle] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();
  const router = useRouter();
  const params = useParams();
  const articleSlug = params?.slug as string;

  const editor = useEditor({
    extensions: [
      StarterKit,
      TiptapImage,
      TiptapLink.configure({ openOnClick: false, autolink: true }),
    ],
    content: '', // Initial content will be set after fetching article data
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl m-5 focus:outline-none border border-gray-300 p-4 rounded-md min-h-[200px]',
      },
    },
  });

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
    if (!articleSlug || !token || !editor) {
        setIsFetchingArticle(false);
        if (!token) setError("用户未认证");
        if (!editor && articleSlug && token) setError("编辑器初始化中..."); // Or handle this case
        return;
    };

    const fetchArticleData = async () => {
      setIsFetchingArticle(true);
      setError(null);
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8787';
        // 假设后端 /api/articles/:slug 返回 ArticleWithCategoryAndAttachments 类型的数据
        const response = await fetch(`${backendUrl}/api/articles/${articleSlug}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) {
          if (response.status === 404) throw new Error('文章未找到');
          throw new Error('获取文章数据失败');
        }
        const article: Article & { category?: Category, attachments?: UploadedAttachment[], content_type?: string } = await response.json();
        
        setArticleIdForUpdate(article.id);
        setTitle(article.title);
        setCategoryId(article.category_id || '');
        
        // 设置编辑器内容
        // 如果是 markdown，理想情况下应该转换为 HTML，或让编辑器处理
        // 为简单起见，如果 content_type 是 html 或未定义（假定为旧文章的 markdown）都直接设置
        editor.commands.setContent(article.content || '');
        
        // 设置附件
        if (article.attachments && Array.isArray(article.attachments)) {
          setAttachments(article.attachments.map(att => ({...att, key: att.file_url}))); // Use file_url as key if no specific key from backend
        } else {
          //兼容旧的 image_urls (如果存在且是字符串)
          // @ts-ignore - 兼容旧数据
          if (typeof article.image_urls === 'string' && article.image_urls) {
            // @ts-ignore
            setAttachments([{ file_url: article.image_urls, key: article.image_urls, file_type: 'image', filename: '旧特色图片' }]);
          }
        }

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
  }, [articleSlug, token, editor]);

  const handleAttachmentUploadSuccess = (uploadedFile: { file_url: string; file_type: string; filename: string; key: string }) => {
    setAttachments(prev => [...prev, uploadedFile]);
    setAttachmentUploadError(null);
  };

  const handleAttachmentUploadError = (errorMessage: string) => {
    setAttachmentUploadError(errorMessage);
  };

  const removeAttachment = (keyToRemove: string) => {
    setAttachments(prev => prev.filter(att => att.key !== keyToRemove));
    // TODO: 如果是已保存的附件，需要标记为待删除，并在提交时处理
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!editor) {
      setError('编辑器未初始化');
      return;
    }
    if (!token || !articleIdForUpdate) {
      setError('用户未认证或文章 ID 无效');
      return;
    }
    const htmlContent = editor.getHTML();
    if (!title || htmlContent === '<p></p>' || !categoryId) {
      setError('标题、内容和分类不能为空');
      return;
    }

    setIsLoading(true);
    setError(null);

    const articleDataToSubmit = {
      title,
      content: htmlContent,
      content_type: 'html',
      category_id: Number(categoryId),
      // 后端 updateArticle 服务需要处理 attachments 的更新逻辑
      // (例如：对比现有附件，删除不再存在的，添加新的)
      // 这里我们发送当前的附件列表，后端需要智能处理
      attachments: attachments.map(({ key, ...rest }) => rest),
    };

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8787';
      // PUT 请求发送 JSON 数据
      const response = await fetch(`${backendUrl}/api/articles/${articleIdForUpdate}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(articleDataToSubmit),
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

  if (!editor || isFetchingArticle) { // 编辑器加载中或文章数据获取中
    return <div className="text-center py-10">加载中...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">编辑文章 (ID: {articleIdForUpdate})</h1>
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
            内容
          </label>
          {/* Tiptap 编辑器工具栏可以后续添加 */}
          <EditorContent editor={editor} />
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

        {/* 附件上传与管理 */}
        <div className="mt-6">
          <h2 className="text-lg font-medium text-gray-900 mb-2">附件管理</h2>
          <FileUpload
            onUploadSuccess={handleAttachmentUploadSuccess}
            onUploadError={handleAttachmentUploadError}
            directoryPrefix={`articles/${articleIdForUpdate || 'temp'}/`}
          />
          {attachmentUploadError && <p className="text-red-500 text-sm mt-1">{attachmentUploadError}</p>}
          {attachments.length > 0 && (
            <div className="mt-4">
              <h3 className="text-md font-medium text-gray-700">当前附件:</h3>
              <ul className="list-disc list-inside mt-2 space-y-1">
                {attachments.map((att, index) => (
                  <li key={att.key || att.id || index} className="text-sm text-gray-600 flex justify-between items-center">
                    <a href={att.file_url.startsWith('http') ? att.file_url : undefined} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {att.filename || att.key} ({att.file_type})
                    </a>
                    <button
                      type="button"
                      onClick={() => removeAttachment(att.key)}
                      className="ml-2 text-red-500 hover:text-red-700 text-xs"
                    >
                      移除
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
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