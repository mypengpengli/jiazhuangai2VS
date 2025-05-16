'use client';

import React, { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Category } from '@/types/models'; // 假设 Category 类型已定义
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import LinkExtension from '@tiptap/extension-link'; // Renamed to avoid conflict with next/link
import FileUpload from '@/components/FileUpload'; // 导入 FileUpload 组件

// 定义附件类型，与后端 CreateArticleInput 中的 attachments 数组元素对应
interface AttachmentInput {
  file_url: string;
  file_type: string;
  filename?: string;
  description?: string;
  // 'key' is used internally by FileUpload's onUploadSuccess but not sent to backend directly in this structure
}

interface UploadedAttachment extends AttachmentInput {
  key: string; // R2 object key, useful for managing uploads or if file_url is not a direct public URL
}


const CreateArticlePage = () => {
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [attachments, setAttachments] = useState<UploadedAttachment[]>([]); // 存储已上传的附件信息
  const [attachmentUploadError, setAttachmentUploadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();
  const router = useRouter();

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image, // Basic image support
      LinkExtension.configure({ // Renamed import
        openOnClick: false,
        autolink: true,
      }),
    ],
    content: '<p>开始写作...</p>', // Initial content
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl m-5 focus:outline-none border border-gray-300 p-4 rounded-md min-h-[200px]',
      },
    },
  });

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

  // const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => { ... };

  const handleAttachmentUploadSuccess = (uploadedFile: { file_url: string; file_type: string; filename: string; key: string }) => {
    setAttachments(prev => [...prev, uploadedFile]);
    setAttachmentUploadError(null); // 清除之前的错误
    // alert(`文件 "${uploadedFile.filename}" 上传成功!`);
  };

  const handleAttachmentUploadError = (errorMessage: string) => {
    setAttachmentUploadError(errorMessage);
  };

  const removeAttachment = (keyToRemove: string) => {
    setAttachments(prev => prev.filter(att => att.key !== keyToRemove));
    // 注意：这里只是从待提交列表中移除，如果需要从 R2 删除已上传文件，需要额外逻辑
  };


  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!editor) {
      setError('编辑器未初始化');
      return;
    }
    if (!token) {
      setError('用户未认证');
      return;
    }
    const htmlContent = editor.getHTML();
    if (!title || htmlContent === '<p></p>' || !categoryId) { // 检查编辑器内容是否为空
      setError('标题、内容和分类不能为空');
      return;
    }

    setIsLoading(true);
    setError(null);

    const articleData = {
      title,
      content: htmlContent,
      content_type: 'html', // Tiptap 输出 HTML
      category_id: Number(categoryId),
      attachments: attachments.map(({ key: _key, ...rest }) => rest), // 移除 key 字段，只发送后端需要的附件元数据
    };

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8787';
      const response = await fetch(`${backendUrl}/api/articles`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(articleData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: '创建文章失败' }));
        throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
      }

      alert('文章创建成功！');
      router.push('/admin/articles');
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
  
  if (!editor) {
    return null; // 或者显示加载状态
  }

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
            内容
          </label>
          {/* Tiptap 编辑器工具栏可以后续添加 */}
          {/* <MenuBar editor={editor} /> */}
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

        {/* 文件上传组件 */}
        <FileUpload
          onUploadSuccess={handleAttachmentUploadSuccess}
          onUploadError={handleAttachmentUploadError}
          directoryPrefix="articles/attachments/" // 可选，指定 R2 存储路径前缀
        />
        {attachmentUploadError && <p className="text-red-500 text-sm mt-1">{attachmentUploadError}</p>}

        {/* 显示已上传的附件列表 */}
        {attachments.length > 0 && (
          <div className="mt-4">
            <h3 className="text-md font-medium text-gray-700">已上传附件:</h3>
            <ul className="list-disc list-inside mt-2 space-y-1">
              {attachments.map((att, index) => (
                <li key={att.key || index} className="text-sm text-gray-600 flex justify-between items-center">
                  <span>{att.filename || att.key} ({att.file_type})</span>
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
        
        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isLoading ? '创建中...' : '创建文章'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateArticlePage;