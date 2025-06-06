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
import TextAlign from '@tiptap/extension-text-align'; // 导入 TextAlign
import Color from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
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
  const [pendingPastedImage, setPendingPastedImage] = useState<{ src: string; alt: string } | null>(null); // 新状态
  const [displayDate, setDisplayDate] = useState<string>(''); // 新状态用于显示日期
  const [attachmentUploadError, setAttachmentUploadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingArticle, setIsFetchingArticle] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();
  const router = useRouter();
  const params = useParams();
  const articleSlug = params?.slug as string;

  // Helper function to convert base64 to Blob
  const base64ToBlob = (base64Data: string, contentType = '', sliceSize = 512) => {
    const base64Content = base64Data.split(',')[1];
    if (!base64Content) {
      throw new Error('Invalid base64 data');
    }
    const byteCharacters = atob(base64Content);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    let finalContentType = contentType;
    if (!finalContentType && base64Data.startsWith('data:')) {
      const mimeMatch = base64Data.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/);
      if (mimeMatch && mimeMatch[1]) {
        finalContentType = mimeMatch[1];
      }
    }
    if (!finalContentType) finalContentType = 'application/octet-stream';

    return new Blob(byteArrays, { type: finalContentType });
  };

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
          const { uploadUrl, key, publicUrl: directPublicUrl } = presignedData; // 使用 uploadUrl 和 key
          console.log('Received presigned data for edit page:', JSON.stringify(presignedData));
          console.log('Upload URL for R2 (edit page):', uploadUrl);
          console.log('R2 Object Key from backend (edit page):', key); // 使用 key

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
          
          const finalPublicUrl = directPublicUrl || (process.env.NEXT_PUBLIC_R2_PUBLIC_URL_PREFIX ? `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL_PREFIX.replace(/\/$/, '')}/${key}` : key); // 使用 key

          // 图片上传成功后，设置待插入图片状态，由 useEffect 处理实际插入
          setPendingPastedImage({ src: finalPublicUrl, alt: file.name });

          handleAttachmentUploadSuccess({
            file_url: key, // 使用 key
            publicUrl: finalPublicUrl,
            file_type: file.type,
            filename: file.name,
            key: key,      // 使用 key
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
      TiptapImage.configure({
        inline: true,
        allowBase64: true,
      }),
      TiptapLink.configure({ 
        openOnClick: false, 
        autolink: true,
        HTMLAttributes: {
          class: 'text-blue-600 underline hover:text-blue-800 cursor-pointer',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      Color,
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse border border-gray-300 w-full',
        },
      }),
      TableRow.configure({
        HTMLAttributes: {
          class: 'border border-gray-300',
        },
      }),
      TableHeader.configure({
        HTMLAttributes: {
          class: 'border border-gray-300 bg-gray-100 font-bold p-2 text-left',
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-gray-300 p-2',
        },
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl max-w-none focus:outline-none border border-gray-300 p-4 rounded-b-md min-h-[400px] bg-white',
        style: 'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;',
      },
      handlePaste(view, event, _slice) { // slice is the ProseMirror Slice
        const editor = this as Editor; // 'this' is the Editor instance
        const pastedHtml = event.clipboardData?.getData('text/html');
        const filesFromClipboard = Array.from(event.clipboardData?.files || []);
        const filesToUploadFromHtml: File[] = [];

        if (pastedHtml) {
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = pastedHtml;
          const imagesInHtml = Array.from(tempDiv.querySelectorAll('img'));

          imagesInHtml.forEach(img => {
            const src = img.getAttribute('src');
            if (src && src.startsWith('data:image')) {
              try {
                const blob = base64ToBlob(src);
                const extension = blob.type.split('/')[1] || 'png';
                const filename = `pasted_image_${Date.now()}.${extension}`;
                const file = new File([blob], filename, { type: blob.type });
                filesToUploadFromHtml.push(file);
              } catch (e) {
                console.error("Error processing base64 image from HTML:", e);
              }
            }
          });
        }

        const allFilesToUpload = [...filesFromClipboard, ...filesToUploadFromHtml];

        if (allFilesToUpload.some(file => file.type.startsWith('image/'))) {
          handlePastedFiles(editor, allFilesToUpload.filter(file => file.type.startsWith('image/')));

          if (pastedHtml && filesToUploadFromHtml.length > 0) {
            const plainText = event.clipboardData?.getData('text/plain');
            if (plainText && editor && !editor.isDestroyed) {
               // 延迟以确保在编辑器状态更新后执行
              setTimeout(() => {
                if (editor && !editor.isDestroyed) {
                  // 尝试插入纯文本内容
                  // view.dispatch(view.state.tr.insertText(plainText || ''));
                }
              }, 0);
            }
            return true;
          } else if (filesFromClipboard.length > 0) {
            return true;
          }
        }
        
        return false;
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
        
        // 设置显示日期
        if (article.display_date) {
          const dateFromApi = new Date(article.display_date);
          if (!isNaN(dateFromApi.getTime())) {
            // 转换为本地时间并格式化为 YYYY-MM-DDTHH:mm
            const localDate = new Date(dateFromApi.valueOf() - dateFromApi.getTimezoneOffset() * 60000);
            setDisplayDate(localDate.toISOString().slice(0, 16));
          } else {
            // 如果API返回的日期无效，则将输入框设置为空
            setDisplayDate('');
            console.warn(`Invalid display_date from API: ${article.display_date}`);
          }
        } else {
          // 如果API没有返回display_date (null or undefined), 将输入框设置为空
          setDisplayDate('');
        }
        
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
          setError('加载文章数据失败: 发生未知错误');
        }
      } finally {
        setIsFetchingArticle(false);
      }
    };
    fetchArticleData();
  }, [articleSlug, token, editor]);

  // useEffect 用于处理粘贴图片的自动插入
  useEffect(() => {
    if (pendingPastedImage && editor && !editor.isDestroyed) {
      editor.chain().focus().setImage({ src: pendingPastedImage.src, alt: pendingPastedImage.alt }).run();
      setPendingPastedImage(null); // 清除状态，避免重复插入
    }
  }, [pendingPastedImage, editor]);

  // useEffect 用于处理粘贴图片的自动插入
  useEffect(() => {
    if (pendingPastedImage && editor && !editor.isDestroyed) {
      editor.chain().focus().setImage({ src: pendingPastedImage.src, alt: pendingPastedImage.alt }).run();
      setPendingPastedImage(null); // 清除状态，避免重复插入
    }
  }, [pendingPastedImage, editor]);

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
      display_date: displayDate ? new Date(displayDate).toISOString() : null, // 添加 display_date
      // 后端 updateArticle 服务需要处理 attachments 的更新逻辑
      // (例如：对比现有附件，删除不再存在的，添加新的)
      // 这里我们发送当前的附件列表，后端需要智能处理
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      attachments: attachments.map(({ key: _key, ...rest }) => rest),
    };

    console.log('Frontend: Submitting articleDataToSubmit:', JSON.stringify(articleDataToSubmit, null, 2)); // 正确位置的日志

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

        <div>
          <label htmlFor="displayDate" className="block text-sm font-medium text-gray-700">
            显示日期和时间
          </label>
          <input
            type="datetime-local"
            id="displayDate"
            value={displayDate}
            onChange={(e) => setDisplayDate(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
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