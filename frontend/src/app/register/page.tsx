'use client'; // 表单交互需要客户端组件

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // 导入 useRouter

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter(); // 初始化 router

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    setIsLoading(true);
    // console.log('Registration attempt with:', { username, password }); // 保留用于调试

    // --- Call API ---
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8787';
      const res = await fetch(`${backendUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error('Registration failed:', data);
        setError(data.error || `注册失败 (${res.status})`);
      } else {
        console.log('Registration successful:', data);
        alert('注册成功！现在将跳转到登录页面。');
        router.push('/login'); // 注册成功后跳转到登录页
      }
    } catch (err) {
      console.error('Registration request error:', err);
      setError('发生网络错误，请稍后重试。');
    } finally {
      setIsLoading(false);
    }
    // --- End of API Call ---
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <h1 className="text-3xl font-bold mb-6 text-center">用户注册</h1>
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
            用户名
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="username"
            type="text"
            placeholder="请输入用户名"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
            密码
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="password"
            type="password"
            placeholder="******************"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="confirmPassword">
            确认密码
          </label>
          <input
            className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline ${password !== confirmPassword && confirmPassword ? 'border-red-500' : ''}`}
            id="confirmPassword"
            type="password"
            placeholder="******************"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={isLoading}
          />
           {password !== confirmPassword && confirmPassword && (
             <p className="text-red-500 text-xs italic">两次输入的密码不一致。</p>
           )}
        </div>
        {error && password === confirmPassword && ( // 只在密码一致时显示后端错误
          <p className="text-red-500 text-xs italic mb-4">{error}</p>
        )}
        <div className="flex items-center justify-center">
          <button
            className={`bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            type="submit"
            disabled={isLoading || (password !== confirmPassword && confirmPassword !== '')}
          >
            {isLoading ? '注册中...' : '注册'}
          </button>
        </div>
         <p className="text-center text-gray-500 text-xs mt-4">
           已有账户？ <Link href="/login" className="text-blue-500 hover:text-blue-800">前往登录</Link>
         </p>
      </form>
      <p className="text-center text-gray-500 text-xs">
        &copy;{new Date().getFullYear()} 家装AI助手.
      </p>
    </div>
  );
}