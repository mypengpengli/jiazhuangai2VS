'use client'; // 表单交互需要客户端组件

import React, { useState } from 'react';
import { useRouter } from 'next/navigation'; // 取消注释 useRouter
import { useAuth } from '@/context/AuthContext'; // 导入 useAuth

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter(); // 取消注释 router 初始化
  const { login } = useAuth(); // 从 useAuth 获取 login 函数

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    // console.log('Login attempt with:', { username, password }); // 保留用于调试

    // --- Call API and Context ---
    try {
      // 环境变量需要在 next.config.js 或 .env 文件中配置，并加上 NEXT_PUBLIC_ 前缀才能在客户端访问
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8787';
      const res = await fetch(`${backendUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error('Login failed:', data);
        setError(data.error || `登录失败 (${res.status})`);
      } else {
        console.log('Login successful, received token.');
        // 调用 AuthContext 的 login 方法存储 token
        // 后端 login 接口目前只返回 token，没有 user 数据
        login(data.token);
        // 登录成功后跳转到首页
        router.push('/');
      }
    } catch (err) {
      console.error('Login request error:', err);
      setError('发生网络错误，请稍后重试。');
    } finally {
      setIsLoading(false);
    }
    // --- End of API Call ---
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <h1 className="text-3xl font-bold mb-6 text-center">用户登录</h1>
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
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
            密码
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
            id="password"
            type="password"
            placeholder="******************"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />
          {/* <p className="text-red-500 text-xs italic">Please choose a password.</p> */}
        </div>
        {error && (
          <p className="text-red-500 text-xs italic mb-4">{error}</p>
        )}
        <div className="flex items-center justify-between">
          <button
            className={`bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? '登录中...' : '登录'}
          </button>
          {/* <a className="inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-800" href="#">
            Forgot Password?
          </a> */}
        </div>
         {/* TODO: Add link to registration page */}
         {/* <p className="text-center text-gray-500 text-xs mt-4">
           还没有账户？ <Link href="/register" className="text-blue-500 hover:text-blue-800">立即注册</Link>
         </p> */}
      </form>
      <p className="text-center text-gray-500 text-xs">
        &copy;{new Date().getFullYear()} 甲状腺疾病科普网站.
      </p>
    </div>
  );
}