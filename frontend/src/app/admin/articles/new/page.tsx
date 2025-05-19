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
import TextAlign from '@tiptap/extension-text-align'; // 导入 TextAlign
import FileUpload from '@/components/FileUpload';
import MenuBar from '@/components/MenuBar';

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
          const { uploadUrl, key, publicUrl: directPublicUrl } = presignedData; // Changed r2Key to key
          console.log('Received presigned data:', JSON.stringify(presignedData));
          console.log('Upload URL for R2:', uploadUrl);
          console.log('R2 Object Key from backend:', key); // Log the received key

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
          
          const finalPublicUrl = directPublicUrl || (process.env.NEXT_PUBLIC_R2_PUBLIC_URL_PREFIX ? `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL_PREFIX.replace(/\/$/, '')}/${key}` : key); // Changed r2Key to key

          // 增加检查 editorInstance 是否有效且未被销毁
          if (editorInstance && !editorInstance.isDestroyed) { // 确保 editorInstance 存在且未销毁
            // 使用 setTimeout 确保在编辑器状态稳定后插入图片
            setTimeout(() => {
              if (editorInstance && !editorInstance.isDestroyed) {
                editorInstance.chain().focus().setImage({ src: finalPublicUrl, alt: file.name }).run();
              } else {
                console.warn('Editor instance became unavailable or destroyed before setTimeout for pasted image insertion.');
                setAttachmentUploadError('编辑器状态异常，图片已上传但无法自动插入(timeout)。请尝试手动插入或刷新页面。');
              }
            }, 0);
          } else {
            console.warn('Editor instance is not available or destroyed when trying to insert pasted image.');
            setAttachmentUploadError('编辑器状态异常，图片已上传但无法自动插入。请尝试手动插入或刷新页面。');
          }
          // 调用已有的 handleAttachmentUploadSuccess 来更新附件列表状态
          handleAttachmentUploadSuccess({
            file_url: key, // Use key from backend
            publicUrl: finalPublicUrl,
            file_type: file.type,
            filename: file.name,
            key: key,      // Use key from backend
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
      TextAlign.configure({ // 添加 TextAlign 扩展
        types: ['heading', 'paragraph'], // 指定支持对齐的节点类型
      }),
    ],
    content: '<p>开始写作...</p>',
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl m-5 focus:outline-none border border-gray-300 p-4 rounded-md min-h-[200px]',
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
          // 如果有图片（来自直接文件粘贴或HTML中的base64）
          handlePastedFiles(editor, allFilesToUpload.filter(file => file.type.startsWith('image/')));

          if (pastedHtml && filesToUploadFromHtml.length > 0) {
            // 如果HTML中有base64图片被处理，我们尝试只粘贴文本部分
            // 这会丢失HTML格式，但能避免粘贴巨大的base64字符串
            const plainText = event.clipboardData?.getData('text/plain');
            if (plainText && editor && !editor.isDestroyed) {
              // 清除默认的HTML粘贴（如果Tiptap会做的话），然后插入纯文本
              // Tiptap的默认粘贴处理比较复杂，这里简单阻止并插入文本
              // 这可能不是最优的，因为格式会丢失
              // 一个更好的方法是修改slice以移除img标签，但保留其他格式
              // 此处简单地插入提取的文本，让图片通过handlePastedFiles异步插入
              
              // 延迟以确保在编辑器状态更新后执行
              setTimeout(() => {
                if (editor && !editor.isDestroyed) {
                  // 尝试替换当前选区或插入纯文本
                  // 这里的逻辑可能需要根据Tiptap版本和具体行为调整
                  // 目标是粘贴文本，而图片由handlePastedFiles处理
                  // view.dispatch(view.state.tr.insertText(plainText || ''));
                  // 更好的做法可能是让Tiptap处理文本粘贴，我们只处理图片
                  // 但如果同时存在图片和文本，Tiptap如何处理一个被修改的slice是个问题
                  // 目前，如果从HTML提取了图片，我们返回true，意味着我们处理了这次粘贴
                  // 而图片插入是异步的。文本部分如果也想智能粘贴，需要更复杂的slice操作。
                  // 为了先保证图片上传，这里的文本处理可能不完美。
                  // 如果要保留HTML格式但移除base64图片，需要修改slice或pastedHtml字符串
                }
              }, 0);
            }
            return true; // 表示我们处理了粘贴（至少是图片部分）
          } else if (filesFromClipboard.length > 0) {
            // 仅有来自剪贴板的文件（例如截图），没有HTML中的base64图片
            return true; // handlePastedFiles 会处理
          }
        }
        
        // 如果没有图片文件，并且HTML中也没有需要处理的base64图片，则使用默认粘贴
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
          detailedMessage = "后端验证失败: " + errorData.error.issues.map((issue: ZodIssueSimple) => `[${issue.path.join('.') || 'field'}]: ${issue.message}`).join('; ');
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