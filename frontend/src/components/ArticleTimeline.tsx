'use client'; // May need client-side interactivity for timeline features

import React from 'react';
import Link, { LinkProps } from 'next/link';
import { Article } from '@/types/models';

interface ArticleTimelineProps {
  articles: Article[];
}

const ArticleTimeline: React.FC<ArticleTimelineProps> = ({ articles }) => {
  if (!articles || articles.length === 0) {
    return <p className="text-center text-gray-600">暂无文章可显示在时间轴上。</p>;
  }

  // Group articles by year and month for a more structured timeline
  const groupedArticles: { [year: string]: { [month: string]: Article[] } } = {};
  articles.forEach(article => {
    const date = new Date(article.display_date || article.created_at);
    const year = date.getFullYear().toString();
    const month = date.toLocaleString('zh-CN', { month: 'long' }); // e.g., '五月'

    if (!groupedArticles[year]) {
      groupedArticles[year] = {};
    }
    if (!groupedArticles[year][month]) {
      groupedArticles[year][month] = [];
    }
    groupedArticles[year][month].push(article);
  });

  return (
    <div className="relative antialiased">
      {/* Vertical line of the timeline */}
      <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-indigo-300 transform -translate-x-1/2 hidden md:block"></div>

      {Object.keys(groupedArticles).sort((a, b) => parseInt(b) - parseInt(a)).map(year => (
        <div key={year} className="mb-12">
          <div className="flex items-center justify-center mb-8 md:mb-0">
            <div className="md:absolute md:left-1/2 md:transform md:-translate-x-1/2 z-10">
              <div className="bg-indigo-600 text-white font-bold rounded-full py-2 px-6 shadow-lg">
                {year}年
              </div>
            </div>
          </div>

          {Object.keys(groupedArticles[year]).sort((a, b) => {
            // Simple month sort (can be improved for actual date comparison if months are not unique)
            const monthOrder = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
            // Corrected month sorting to handle potential missing months in monthOrder
            const indexA = monthOrder.indexOf(a);
            const indexB = monthOrder.indexOf(b);
            if (indexA === -1 && indexB === -1) return 0;
            if (indexA === -1) return 1; // Put unknown months at the end
            if (indexB === -1) return -1; // Put unknown months at the end
            return indexB - indexA; // Sort descending by month display
          }).map(month => (
            <div key={month} className="mb-10">
              <div className="flex items-center justify-center mb-6 md:mb-0">
                 <div className="md:absolute md:left-1/2 md:transform md:-translate-x-1/2 z-10 md:mt-10">
                    <div className="bg-purple-500 text-white font-semibold rounded-full py-1 px-4 shadow-md text-sm">
                        {month}
                    </div>
                </div>
              </div>
              
              {groupedArticles[year][month].map((article, index) => (
                <div 
                    key={article.id} 
                    className={`mb-8 flex md:items-center w-full ${index % 2 === 0 ? 'md:flex-row-reverse' : 'md:flex-row'} justify-between`}
                >
                  <div className="hidden md:block w-5/12"></div> {/* Spacer */}
                  <div className="md:absolute md:left-1/2 md:transform md:-translate-x-1/2 z-10">
                    <div className="bg-gray-300 w-5 h-5 rounded-full border-4 border-white shadow-sm"></div>
                  </div>
                  <div className="bg-white rounded-xl shadow-xl overflow-hidden w-full md:w-5/12 p-6 transform hover:shadow-2xl hover:scale-105 transition-all duration-300 ease-in-out">
                    <div className="text-xs text-indigo-600 uppercase font-semibold mb-1">
                      {article.category?.name || '未分类'} &middot; {new Date(article.display_date || article.created_at).toLocaleDateString('zh-CN', { day: 'numeric' })}
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-gray-800 hover:text-indigo-700 transition-colors duration-300">
                      {/* @ts-ignore next-line */}
                      <Link href={`/articles/${article.slug}`} className="hover:underline">
                        {article.title}
                      </Link>
                    </h3>
                    {article.summary && (
                      <p className="text-gray-600 text-sm leading-relaxed mb-3">
                        {article.summary}
                      </p>
                    )}
                    {/* @ts-ignore next-line */}
                    <Link href={`/articles/${article.slug}`} className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800 font-semibold transition-colors duration-300">
                      阅读详情
                      <svg className="ml-1.5 w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default ArticleTimeline; 