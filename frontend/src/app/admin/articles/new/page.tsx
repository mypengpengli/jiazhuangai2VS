'use client';

import React, { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Category } from '@/types/models'; // 假设 Category 类型已定义
import { useEditor, EditorContent, Editor } from '@tiptap/react'; // Import Editor
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import LinkExtension from '@tiptap/extension-link';
import FileUpload from '@/components/FileUpload';
import MenuBar from '@/components/MenuBar';

// 定义附件类型，与后端 CreateArticleInput 中的 attachments 数组元素对应
interface AttachmentInput {
  file_url: string;
  file_type: string;
  filename?: string;
  description?: string;
  // 'key' is used internally by FileUpload's onUploadSuccess but not sent to backend directly in this structure
}

interface UploadedAttachment extends AttachmentInput {
  key: string; // R2 object key
  publicUrl?: string; // Full public URL for accessing the file
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

  const handlePastedFiles = async (editorInstance: Editor, files: File[]) => {
    if (!token) {
      setAttachmentUploadError("用户未认证，无法上传粘贴的图片。");
      return;
    }
    // 对于新文章，可以使用一个通用或临时的前缀
    const directoryPrefix = `articles/attachments/`; // 与 FileUpload 组件保持一致

    for (const file of files) {
      if (file.type.startsWith('image/')) {
        setAttachmentUploadError(null);
        setIsLoading(true); // 使用页面级的 isLoading 状态
        try {
          const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8787';
          console.log(`Requesting presigned URL from: ${backendUrl}/api/r2/presigned-url`);
          const presignedUrlResponse = await fetch(`${backendUrl}/api/r2/presigned-url`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              filename: file.name,
              contentType: file.type,
              directoryPrefix: directoryPrefix,
            }),
          });

          if (!presignedUrlResponse.ok) {
            const errorData = await presignedUrlResponse.json().catch(() => ({ message: '获取预签名URL失败' }));
            throw new Error(errorData.message || `获取预签名URL失败: ${presignedUrlResponse.statusText}`);
          }
          const presignedData = await presignedUrlResponse.json();
          const { uploadUrl, r2Key, publicUrl: directPublicUrl } = presignedData; // Changed uploadURL to uploadUrl
          console.log('Received presigned data:', JSON.stringify(presignedData));
          console.log('Upload URL for R2:', uploadUrl); // Changed uploadURL to uploadUrl

          const uploadResponse = await fetch(uploadUrl, { // Changed uploadURL to uploadUrl
            method: 'PUT',
            body: file,
            headers: {
              'Content-Type': file.type,
              // 通常预签名URL包含了所有必要的认证信息，不需要额外的 Authorization header
              // 但如果R2存储桶策略或预签名URL生成方式有特定要求，可能需要调整
            },
          });

          if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text().catch(() => '无法读取响应体');
            console.error('R2 Upload Error. Status:', uploadResponse.status, 'StatusText:', uploadResponse.statusText, 'Response Text:', errorText, 'Attempted URL:', uploadUrl); // Changed uploadURL to uploadUrl
            throw new Error(`上传到R2失败: ${uploadResponse.status} ${uploadResponse.statusText || '(无状态文本)'}. 响应: ${errorText}`);
          }
          console.log('Successfully uploaded to R2 with presigned URL.');
          
          const finalPublicUrl = directPublicUrl || (process.env.NEXT_PUBLIC_R2_PUBLIC_URL_PREFIX ? `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL_PREFIX.replace(/\/$/, '')}/${r2Key}` : r2Key);

          // 增加检查 editorInstance 是否有效且未被销毁
          if (editorInstance && !editorInstance.isDestroyed) { // 确保 editorInstance 存在且未销毁
            editorInstance.chain().focus().setImage({ src: finalPublicUrl, alt: file.name }).run();
          } else {
            console.warn('Editor instance is not available or destroyed when trying to insert pasted image.');
            setAttachmentUploadError('编辑器状态异常，图片已上传但无法自动插入。请尝试手动插入或刷新页面。');
          }
          // 调用已有的 handleAttachmentUploadSuccess 来更新附件列表状态
          handleAttachmentUploadSuccess({
            file_url: r2Key,
            publicUrl: finalPublicUrl,
            file_type: file.type,
            filename: file.name,
            key: r2Key,
          });

        } catch (err: unknown) {
          console.error('Pasted image upload failed:', err);
          let message = '粘贴图片上传失败: 未知错误';
          if (err instanceof Error) {
            message = `粘贴图片上传失败: ${err.message}`;
          } else if (typeof err === 'string') {
            message = `粘贴图片上传失败: ${err}`;
          }
          setAttachmentUploadError(message);
        } finally {
          setIsLoading(false);
        }
      }
    }
  };

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      LinkExtension.configure({
        openOnClick: false,
        autolink: true,
      }),
    ],
    content: '<p>开始写作...</p>',
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl m-5 focus:outline-none border border-gray-300 p-4 rounded-md min-h-[200px]',
      },
      handlePaste(
        view,
        event,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _slice
      ) {
        const files = Array.from(event.clipboardData?.files || []);
        if (files.some(file => file.type.startsWith('image/'))) {
          // `this` 在 handlePaste 回调中指向当前的 Editor 实例
          handlePastedFiles(this, files);
          return true; // 表示已处理粘贴事件
        }
        return false; // 使用默认的粘贴行为
      },
      handleClickOn(
        view,
        pos,
        node,
        nodePos,
        event,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _direct // Renamed direct to _direct
      ) {
        if (node.type.name === 'image' && node.attrs.src) {
          if (event.target instanceof HTMLElement && event.target.tagName === 'IMG') {
            window.open(node.attrs.src, '_blank', 'noopener,noreferrer');
            return true; // 事件已处理
          }
        }
        return false; // 使用默认点击行为
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

  const handleAttachmentUploadSuccess = (uploadedFile: { file_url: string; publicUrl?: string; file_type: string; filename: string; key: string }) => {
    setAttachments(prev => [...prev, { ...uploadedFile, publicUrl: uploadedFile.publicUrl || uploadedFile.file_url /* fallback if publicUrl is somehow undefined */}]);
    setAttachmentUploadError(null); // 清除之前的错误
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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
        const errorData = await response.json().catch(() => ({ message: `创建文章失败，状态码: ${response.status}` }));
        console.error("创建文章失败，后端返回的原始数据:", JSON.stringify(errorData, null, 2));
        let detailedMessage = `HTTP error! status: ${response.status}`;
        if (errorData && errorData.error && errorData.error.issues && Array.isArray(errorData.error.issues)) {
          detailedMessage = "后端验证失败: " + errorData.error.issues.map((issue: any) => `[${issue.path.join('.') || 'field'}]: ${issue.message}`).join('; ');
        } else if (errorData && errorData.message) {
          detailedMessage = errorData.message;
        } else if (errorData && errorData.error && typeof errorData.error === 'string') {
          detailedMessage = errorData.error;
        }
        throw new Error(detailedMessage);
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
          <MenuBar editor={editor} />
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
                <li key={att.key || index} className="text-sm text-gray-600 flex flex-wrap justify-between items-center py-1">
                  <div className="flex-grow mr-2">
                    {att.publicUrl ? (
                      <a href={att.publicUrl} target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-600">
                        {att.filename || att.key}
                      </a>
                    ) : (
                      <span>{att.filename || att.key}</span>
                    )}
                    <span className="ml-2 text-gray-500">({att.file_type})</span>
                  </div>
                  <div className="flex-shrink-0 space-x-2">
                    {att.publicUrl && (
                      <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText(att.publicUrl || '')}
                        className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded"
                      >
                        复制URL
                      </button>
                    )}
                    {att.publicUrl && att.file_type.startsWith('image/') && editor && (
                      <button
                        type="button"
                        onClick={() => editor.chain().focus().setImage({ src: att.publicUrl || '' }).run()}
                        className="text-xs bg-green-200 hover:bg-green-300 px-2 py-1 rounded"
                      >
                        插入图片
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeAttachment(att.key)}
                      className="text-xs bg-red-200 hover:bg-red-300 text-red-700 px-2 py-1 rounded"
                    >
                      移除
                    </button>
                  </div>
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