'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

interface SearchBoxProps {
  initialValue?: string;
  placeholder?: string;
  className?: string;
  compact?: boolean;
}

const SearchBox: React.FC<SearchBoxProps> = ({ 
  initialValue = '', 
  placeholder = '搜索AI模型、工具、资讯...',
  className = '',
  compact = false
}) => {
  const [searchTerm, setSearchTerm] = useState(initialValue);
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/articles?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className={className}>
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-200/45 via-white/35 to-violet-200/45 rounded-2xl blur opacity-70 group-hover:opacity-95 transition duration-300"></div>
        <div className="relative flex items-center overflow-hidden rounded-xl border border-white/80 bg-white/72 shadow-inner shadow-sky-900/5 backdrop-blur-2xl">
          <span className={`${compact ? 'pl-4' : 'pl-5'} text-slate-400`}>
            <svg className={`${compact ? 'w-4 h-4' : 'w-5 h-5'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={placeholder}
            className={`w-full bg-transparent text-slate-800 placeholder-slate-400 focus:outline-none ${compact ? 'px-3 py-3 text-sm' : 'px-4 py-4'}`}
          />
          <button 
            type="submit"
            className={`bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-medium hover:from-cyan-600 hover:to-violet-600 transition-all duration-300 shadow-lg shadow-cyan-500/20 ${compact ? 'px-5 py-3 text-sm' : 'px-6 py-4'}`}
          >
            搜索
          </button>
        </div>
      </div>
    </form>
  );
};

export default SearchBox;
