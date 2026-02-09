'use client';

import React, { useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.jiazhuangai.com';

const SubscribeForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus('error');
      setMessage('请输入有效的邮箱地址');
      return;
    }

    setStatus('loading');
    
    try {
      const res = await fetch(`${API_BASE}/api/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setStatus('success');
        setMessage(data.message || '订阅成功！');
        setEmail('');
      } else {
        setStatus('error');
        setMessage(data.error || '订阅失败');
      }
    } catch (_err) {
      setStatus('error');
      setMessage('网络错误，请稍后重试');
    }
    
    // 3秒后重置状态
    setTimeout(() => {
      setStatus('idle');
      setMessage('');
    }, 3000);
  };

  return (
    <div className="mt-4">
      <p className="text-sm text-gray-400 mb-2">订阅AI资讯</p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input 
          type="email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="输入邮箱" 
          disabled={status === 'loading'}
          className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 disabled:opacity-50"
        />
        <button 
          type="submit"
          disabled={status === 'loading'}
          className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === 'loading' ? '...' : '订阅'}
        </button>
      </form>
      {message && (
        <p className={`text-xs mt-2 ${status === 'success' ? 'text-green-400' : 'text-red-400'}`}>
          {message}
        </p>
      )}
    </div>
  );
};

export default SubscribeForm;
