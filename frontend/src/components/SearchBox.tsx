'use client';

import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { localizedPath, type Locale } from '@/lib/locale';

interface SearchBoxProps {
  initialValue?: string;
  placeholder?: string;
  className?: string;
  compact?: boolean;
  locale?: Locale;
}

const SearchBox = ({
  initialValue = '',
  placeholder,
  locale = 'zh-CN',
  className = '',
  compact = false,
}: SearchBoxProps) => {
  const [searchTerm, setSearchTerm] = useState(initialValue);
  const router = useRouter();

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const query = searchTerm.trim();
    if (query) router.push(localizedPath(`/articles?search=${encodeURIComponent(query)}`, locale));
  };

  return (
    <form onSubmit={handleSearch} className={className} role="search">
      <label className="sr-only" htmlFor="site-search">{locale === 'en' ? 'Search the site' : '站内搜索'}</label>
      <div className="flex min-h-11 overflow-hidden rounded-control border border-slate-200 bg-white shadow-sm transition focus-within:border-sky-300 focus-within:ring-4 focus-within:ring-sky-100">
        <span className="flex items-center pl-3 text-slate-400"><Search className="size-4" /></span>
        <input id="site-search" type="search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder={placeholder ?? (locale === 'en' ? 'Search models, tools, and news...' : '搜索 AI 模型、工具、资讯...')} className={`min-w-0 flex-1 bg-transparent px-3 text-slate-800 outline-none placeholder:text-slate-400 ${compact ? 'text-sm' : ''}`} />
        <button type="submit" className="min-w-16 bg-brand px-4 text-sm font-medium text-white transition hover:bg-brand-strong">{locale === 'en' ? 'Search' : '搜索'}</button>
      </div>
    </form>
  );
};

export default SearchBox;
