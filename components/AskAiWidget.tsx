'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Company {
  name: string;
  slug: string;
}

interface AskAiWidgetProps {
  companies: Company[];
}

export default function AskAiWidget({ companies }: AskAiWidgetProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiSlug, setAiSlug] = useState<string | null>(null);

  // 根据输入过滤公司
  const filteredCompanies = query.length > 0
    ? companies.filter(c =>
        c.name.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5)
    : [];

  // 处理 AI 查询 - 调用真实 API
  const handleAskAI = async () => {
    if (!query.trim()) {
      alert('Please enter your question first');
      return;
    }

    setIsLoading(true);
    setAiResponse(null);
    setAiSlug(null);

    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      
      if (data.error) {
        setAiResponse(data.error);
      } else {
        setAiResponse(data.summary);
        setAiSlug(data.slug);
      }
    } catch (error) {
      console.error('AI Query Error:', error);
      setAiResponse('Sorry, something went wrong. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // 示例提示
  const suggestions = [
    '"Best Hertz code for IBM employees"',
    '"Enterprise discount for AAA members"',
    '"Avis corporate rate in Los Angeles"'
  ];

  return (
    <div className="relative">
      {/* 主卡片容器 */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        {/* 标题区域 */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">🤖</span>
          <h3 className="text-lg font-bold text-gray-900">AI Rental Code Finder</h3>
        </div>

        {/* 描述文字 */}
        <p className="text-gray-600 text-sm mb-5">
          Tell me your company and rental brand — I&apos;ll recommend the best corporate code for you.
        </p>

        {/* 搜索输入框 */}
        <div className="flex gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder="e.g. Hertz discount for IBM employees"
            className="flex-1 px-4 py-3 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-800 bg-gray-50"
          />
          <button
            type="button"
            onClick={handleAskAI}
            disabled={isLoading}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-4 sm:px-6 py-3 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
          >
            {isLoading ? 'Thinking...' : 'Ask AI'}
          </button>
        </div>

        {/* AI 响应区域 */}
        {aiResponse && (
          <div className="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
            <div className="flex items-start gap-2">
              <span className="text-lg">🤖</span>
              <div>
                <p className="text-sm text-gray-800">{aiResponse}</p>
                {aiSlug && (
                  <Link
                    href={`/ask/${aiSlug}`}
                    className="inline-block mt-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    Read full guide →
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 示例提示 */}
        <div className="mt-4 flex items-start gap-2 text-xs text-gray-500">
          <span className="text-yellow-500">💡</span>
          <div className="flex flex-wrap gap-1">
            <span>Try:</span>
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => setQuery(suggestion.replace(/"/g, ''))}
                className="text-gray-400 hover:text-indigo-600 transition-colors"
              >
                {suggestion}{index < suggestions.length - 1 ? ' · ' : ''}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 下拉建议列表 */}
      {isOpen && (query.length > 0 || filteredCompanies.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50">
          {filteredCompanies.length > 0 ? (
            <div className="py-2">
              <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Matching Companies
              </div>
              {filteredCompanies.map((company) => (
                <Link
                  key={company.slug}
                  href={`/search?q=${encodeURIComponent(company.name)}`}
                  className="block px-4 py-3 hover:bg-blue-50 transition-colors"
                  onClick={() => {
                    setQuery(company.name);
                    setIsOpen(false);
                  }}
                >
                  <div className="font-medium text-gray-900">{company.name}</div>
                  <div className="text-sm text-gray-500">View discount codes &rarr;</div>
                </Link>
              ))}
            </div>
          ) : query.length > 0 ? (
            <div className="px-4 py-4 text-gray-500">
              <p>No companies found for &quot;{query}&quot;</p>
              <Link
                href={`/search?q=${encodeURIComponent(query)}`}
                className="text-blue-600 hover:underline text-sm mt-1 inline-block"
              >
                Search anyway &rarr;
              </Link>
            </div>
          ) : null}
        </div>
      )}

      {/* 点击外部关闭 */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
