'use client';

import React, { useState, ChangeEvent } from 'react';
import { useAuth } from '@/context/AuthContext'; // 假设 AuthContext 在此路径

interface FileUploadProps {
  onUploadSuccess: (attachment: { file_url: string; file_type: string; filename: string; key: string }) => void;
  onUploadError: (error: string) => void;
  directoryPrefix?: string; // 例如 'articles/images/' 或 'user-avatars/'
}

const FileUpload: React.FC<FileUploadProps> = ({ onUploadSuccess, onUploadError, directoryPrefix = '' }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const { token } = useAuth();

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setFileName(file.name);
      setIsUploading(true);
      onUploadError(''); // 清除之前的错误

      if (!token) {
        onUploadError('用户未认证，无法上传文件。');
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
          body: JSON.stringify({ fileName: file.name, contentType: file.type, directoryPrefix }),
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
          const r2ErrorText = await uploadResponse.text().catch(() => '无法获取R2错误详情');
          console.error('R2 Upload Error Text:', r2ErrorText);
          throw new Error(`文件上传到 R2 失败: ${uploadResponse.statusText}. R2 Response: ${r2ErrorText.substring(0, 200)}`);
        }
        
        onUploadSuccess({ file_url: key, file_type: file.type, filename: file.name, key });

      } catch (err: unknown) {
        console.error('File upload failed:', err);
        if (err instanceof Error) {
          onUploadError(err.message);
        } else {
          onUploadError('文件上传时发生未知错误。');
        }
      } finally {
        setIsUploading(false);
        if (event.target) {
          event.target.value = ''; 
        }
        setFileName(null);
      }
    }
  };

  return (
    <div className="my-4">
      <label className="block text-sm font-medium text-gray-700">
        上传文件
      </label>
      <input
        type="file"
        onChange={handleFileChange}
        disabled={isUploading}
        className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed"
      />
      {isUploading && <p className="text-sm text-blue-500 mt-1">上传中 {fileName ? `(${fileName})` : ''}...</p>}
    </div>
  );
};

export default FileUpload;