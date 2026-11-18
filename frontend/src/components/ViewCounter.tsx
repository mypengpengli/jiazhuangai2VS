'use client';

import { Eye } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { formatNumber } from '@/lib/formatters';
import type { Locale } from '@/lib/locale';

interface ViewCounterProps {
  slug: string;
  initialCount: number;
  locale?: Locale;
}

const ViewCounter = ({ slug, initialCount, locale = 'zh-CN' }: ViewCounterProps) => {
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    const storageKey = `viewed_${slug}`;
    try {
      if (sessionStorage.getItem(storageKey)) return;
    } catch {
      // Continue without session de-duplication in restricted browser contexts.
    }

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8787';
    fetch(`${backendUrl}/api/articles/${slug}/view`, { method: 'POST' })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { view_count?: number } | null) => {
        if (typeof data?.view_count === 'number') setCount(data.view_count);
        try { sessionStorage.setItem(storageKey, '1'); } catch {}
      })
      .catch(() => undefined);
  }, [slug]);

  return <span className="inline-flex items-center gap-1.5"><Eye className="size-4" />{formatNumber(count)} {locale === 'en' ? 'views' : '次阅读'}</span>;
};

export default ViewCounter;
