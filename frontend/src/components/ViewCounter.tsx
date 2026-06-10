'use client';

import React, { useState, useEffect } from 'react';

interface ViewCounterProps {
  slug: string;
  initialCount: number;
}

/**
 * 浏览量计数组件：进入文章页时自动上报浏览量 +1，
 * 使用 sessionStorage 去重，同一会话内刷新不重复计数。
 */
const ViewCounter: React.FC<ViewCounterProps> = ({ slug, initialCount }) => {
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    const storageKey = `viewed_${slug}`;
    try {
      if (sessionStorage.getItem(storageKey)) {
        return; // 本会话已计数过
      }
    } catch {
      // sessionStorage 不可用（如隐私模式）时仍然上报
    }

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8787';
    fetch(`${backendUrl}/api/articles/${slug}/view`, { method: 'POST' })
      .then(res => (res.ok ? res.json() : null))
      .then((data: { view_count?: number } | null) => {
        if (data && typeof data.view_count === 'number') {
          setCount(data.view_count);
        }
        try {
          sessionStorage.setItem(storageKey, '1');
        } catch {
          // 忽略存储失败
        }
      })
      .catch(() => {
        // 上报失败不影响页面展示
      });
  }, [slug]);

  return (
    <span className="inline-flex items-center gap-1">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
      {count.toLocaleString()} 次阅读
    </span>
  );
};

export default ViewCounter;
