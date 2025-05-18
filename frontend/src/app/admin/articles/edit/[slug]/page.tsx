'use client';
export const runtime = 'edge';

import React, { useState, useEffect, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
// import Image from 'next/image'; // next/image might still be useful for displaying uploaded images
import { useAuth } from '@/context/AuthContext';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Category, Article, ArticleAttachment } from '@/types/models'; // ArticleAttachment might be needed if we fetch full attachment details
import { useEditor, EditorContent, Editor } from '@tiptap/react'; // Import Editor type
import StarterKit from '@tiptap/starter-kit';
import TiptapImage from '@tiptap/extension-image';
import TiptapLink from '@tiptap/extension-link';   // Renamed to avoid conflict
import FileUpload from '../../../../../components/FileUpload'; // Corrected relative path
import MenuBar from '../../../../../components/MenuBar'; // 导入 MenuBar 组件

interface ZodIssueSimple {
  path: (string | number)[];
  message: string;
}

// Define attachment types similar to CreateArticlePage
interface AttachmentInput {
  file_url: string;
  file_type: string;
  filename?: string;
  description?: string;
}
interface UploadedAttachment extends AttachmentInput {
  key: string; // R2 object key
  id?: number; // Existing attachments will have an ID
  publicUrl?: string; // Full public URL for accessing the file
}

// 临时接口，用于兼容可能从后端返回的旧 image_urls 字段
interface ArticleWithPotentiallyOldImage extends Article {
  image_urls?: string; // For backward compatibility with old data structure
  // category, attachments, and content_type are inherited from Article
  // and their optionality is handled by the Article type itself or how it's used.
  // No need to redeclare category, attachments, content_type here if Article already defines them correctly.
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

  const handlePastedFiles = async (editorInstance: Editor, files: File[]) => {
    if (!token) {
      setAttachmentUploadError("用户未认证，无法上传粘贴的图片。");
      return;
    }
    const directoryPrefix = `articles/${articleIdForUpdate || 'temp'}/`;

    for (const file of files) {
      if (file.type.startsWith('image/')) {
        setAttachmentUploadError(null); // Clear previous error
        setIsLoading(true); // Indicate loading for paste
        try {
          const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8787';
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
          const presignedData = await presignedUrlResponse.json(); // 先获取数据
          const { uploadUrl, r2Key, publicUrl: directPublicUrl } = presignedData; // 使用 uploadUrl
          console.log('Received presigned data for edit page:', JSON.stringify(presignedData)); // 添加日志
          console.log('Upload URL for R2 (edit page):', uploadUrl); // 添加日志，使用 uploadUrl

          const uploadResponse = await fetch(uploadUrl, { // 使用 uploadUrl
            method: 'PUT',
            body: file,
            headers: { 'Content-Type': file.type },
          });

          if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text().catch(() => '无法读取响应体');
            console.error('R2 Upload Error. Status:', uploadResponse.status, 'StatusText:', uploadResponse.statusText, 'Response Text:', errorText, 'Attempted URL:', uploadUrl); // 使用 uploadUrl
            throw new Error(`上传到R2失败: ${uploadResponse.status} ${uploadResponse.statusText || '(无状态文本)'}. 响应: ${errorText}`);
          }
          console.log('Successfully uploaded to R2 with presigned URL.');
          
          const finalPublicUrl = directPublicUrl || (process.env.NEXT_PUBLIC_R2_PUBLIC_URL_PREFIX ? `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL_PREFIX.replace(/\/$/, '')}/${r2Key}` : r2Key);

          // 增加检查 editorInstance 是否有效且未被销毁
          if (editorInstance && !editorInstance.isDestroyed) {
            editorInstance.chain().focus().setImage({ src: finalPublicUrl, alt: file.name }).run();
          } else {
            console.warn('Editor instance is not available or destroyed when trying to insert pasted image.');
            // 可以考虑给用户一个提示，或者将图片信息暂存，待编辑器可用时再插入
            // 例如，可以将 finalPublicUrl 添加到一个待插入队列
            setAttachmentUploadError('编辑器状态异常，图片已上传但无法自动插入。请尝试手动插入或刷新页面。');
          }
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
      TiptapImage,
      TiptapLink.configure({ openOnClick: false, autolink: true }),
    ],
    content: '',
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
          return true; // We've handled the paste
        }
        return false; // Use default paste behavior
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
          // 检查点击事件是否直接作用在图片上，或者图片是事件目标的一部分
          if (event.target instanceof HTMLElement && event.target.tagName === 'IMG') {
            window.open(node.attrs.src, '_blank', 'noopener,noreferrer');
            return true; // 事件已处理
          }
        }
        return false; // 使用默认点击行为
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
        const article = await response.json() as ArticleWithPotentiallyOldImage;
        
        setArticleIdForUpdate(article.id);
        setTitle(article.title);
        setCategoryId(article.category_id || '');
        
        // 设置编辑器内容
        // 如果是 markdown，理想情况下应该转换为 HTML，或让编辑器处理
        // 为简单起见，如果 content_type 是 html 或未定义（假定为旧文章的 markdown）都直接设置
        editor.commands.setContent(article.content || '');
        
        // 设置附件
        const r2PublicUrlPrefix = process.env.NEXT_PUBLIC_R2_PUBLIC_URL_PREFIX;
        if (article.attachments && Array.isArray(article.attachments)) {
          setAttachments(article.attachments.map(att => {
            const publicUrl = r2PublicUrlPrefix ? `${r2PublicUrlPrefix.replace(/\/$/, '')}/${att.file_url}` : att.file_url;
            return {...att, key: att.file_url, publicUrl };
          }));
        } else {
          //兼容旧的 image_urls (如果存在且是字符串)
          const articleWithOldImage = article as ArticleWithPotentiallyOldImage; // Cast once
          if (typeof articleWithOldImage.image_urls === 'string' && articleWithOldImage.image_urls) {
            const oldImageUrlFromArticle = articleWithOldImage.image_urls;
            const oldImageKey = oldImageUrlFromArticle.startsWith(r2PublicUrlPrefix || '____')
              ? oldImageUrlFromArticle.substring((r2PublicUrlPrefix || '').length).replace(/^\//, '')
              : oldImageUrlFromArticle;
            const publicUrl = r2PublicUrlPrefix ? `${r2PublicUrlPrefix.replace(/\/$/, '')}/${oldImageKey}` : oldImageUrlFromArticle;
            
            setAttachments([{
                file_url: oldImageKey,
                key: oldImageKey,
                publicUrl,
                file_type: 'image',
                filename: '旧特色图片'
            }]);
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

  const handleAttachmentUploadSuccess = (uploadedFile: { file_url: string; publicUrl?: string; file_type: string; filename: string; key: string }) => {
    setAttachments(prev => [...prev, { ...uploadedFile, publicUrl: uploadedFile.publicUrl || uploadedFile.file_url }]);
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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      attachments: attachments.map(({ key: _key, ...rest }) => rest),
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
        const errorData = await response.json().catch(() => ({ message: `更新文章失败，状态码: ${response.status}` }));
        console.error("更新文章失败，后端返回的原始数据:", JSON.stringify(errorData, null, 2));
        let detailedMessage = `HTTP error! status: ${response.status}`;
        if (errorData && errorData.error && errorData.error.issues && Array.isArray(errorData.error.issues)) {
          detailedMessage = "后端验证失败: " + errorData.error.issues.map((issue: ZodIssueSimple) => `[${issue.path.join('.') || 'field'}]: ${issue.message}`).join('; ');
        } else if (errorData && errorData.message) {
          detailedMessage = errorData.message;
        } else if (errorData && errorData.error && typeof errorData.error === 'string') {
          detailedMessage = errorData.error;
        }
        throw new Error(detailedMessage);
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
                  <li key={att.key || att.id || index} className="text-sm text-gray-600 flex flex-wrap justify-between items-center py-1">
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
                    <div className="flex-shrink-0 space-x-2 mt-1 sm:mt-0">
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