'use client'; // 声明为客户端组件，因为我们需要处理表单和状态

import React, { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation'; // 用于路由跳转
// 假设我们有一个 AuthContext 来处理认证状态和 Token
// import { useAuth } from '@/context/AuthContext'; 

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null); // 用于显示获取到的 token
  const router = useRouter();
  // const { login } = useAuth(); // 如果使用 AuthContext

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setToken(null);

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8787';
    const loginApiUrl = `${backendUrl}/api/auth/login`;

    try {
      const response = await fetch(loginApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || '登录失败');
      }

      // 登录成功
      console.log('Login successful:', data);
      setToken(data.token); // 显示 token
      // await login(data.token); // 如果使用 AuthContext，调用 context 的 login 方法
      
      // 简单起见，我们先不跳转，只显示 token
      // router.push('/profile'); // 登录成功后跳转到个人资料页或其他受保护页面

    } catch (err: any) {
      console.error('Login failed:', err);
      setError(err.message || '发生未知错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="p-8 bg-white shadow-md rounded-lg w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">管理员登录</h1>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              用户名
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="admin"
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              密码
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="lipeng%@0"
            />
          </div>
          {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
          {token && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-md break-all">
              <p className="font-semibold">登录成功！Token:</p>
              <p className="text-xs mt-1">{token}</p>
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
