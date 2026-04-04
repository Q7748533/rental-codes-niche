'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export interface Company {
  name: string;
  slug: string;
}

export interface AskAiWidgetProps {
  companies?: Company[];
  initialQuery?: string;
}

export default function AskAiWidget({ companies = [], initialQuery }: AskAiWidgetProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery || '');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Ready');
  const [error, setError] = useState('');

  const hasTriggered = useRef(false); // 🚀 终极防抖锁，保证生命周期内只触发一次

  // Filter companies based on input
  const filteredCompanies = query.length > 0 && companies.length > 0
    ? companies.filter(c =>
        c.name.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5)
    : [];

  // 🚀 核心逻辑抽离：无论是手动点按钮，还是自动触发，都调用这个函数
  const triggerSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setError('');
    setProgress(10);
    setStatusText('Initializing AI Agent...');

    // 🚀 SYNC MODE: 模拟进度动画（因为实际等待是同步的）
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 15;
      });
    }, 2000);

    try {
      setStatusText('Analyzing query & gathering data...');

      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery.trim() }),
      });

      clearInterval(progressInterval);

      if (!res.ok) {
        if (res.status === 429) throw new Error('System busy. Please try again in a minute.');
        throw new Error('Failed to initiate AI generation');
      }

      const data = await res.json();

      if (data.error || !data.slug) {
        throw new Error(data.error || 'Failed to generate article');
      }

      // 🚀 SYNC MODE: 直接拿到最终 slug，无需轮询
      setProgress(100);
      setStatusText('Guide ready! Redirecting...');

      setTimeout(() => {
        router.push(`/ask/${data.slug}`);
      }, 500);

    } catch (err: any) {
      clearInterval(progressInterval);
      setError(err.message || 'Something went wrong.');
      setIsLoading(false);
      setProgress(0);
      setStatusText('Ready');
    }
  };

  // 🚀 自动点火器：严格模式防暴击设计
  useEffect(() => {
    if (initialQuery && !hasTriggered.current) {
      hasTriggered.current = true; // 立即锁死，防止二次触发
      triggerSearch(initialQuery);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  // 手动提交表单
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    triggerSearch(query);
  };

  const clearTask = () => {
    setIsLoading(false);
    setProgress(0);
    setStatusText('Ready');
    setError('');
  };

  const suggestions = [
    'Best Hertz code for IBM employees',
    'Enterprise discount for AAA members',
    'Avis corporate rate in Los Angeles'
  ];

  return (
    <div className="relative">
      {/* Error message */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2">
            <span className="text-red-500">⚠️</span>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
          <button onClick={clearTask} className="mt-2 text-xs text-red-600 hover:text-red-800 underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Loading state with progress bar */}
      {isLoading && (
        <div className="mb-4 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="relative">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                <span className="text-xl">🤖</span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-indigo-500 rounded-full border-2 border-white animate-ping"></div>
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">{statusText}</p>
              <p className="text-sm text-gray-600">Topic: {query}</p>
            </div>
            <button onClick={clearTask} className="text-gray-400 hover:text-gray-600 p-2" title="Cancel">✕</button>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-right">{progress}%</p>
        </div>
      )}

      {/* Main card container */}
      <div className={`bg-white rounded-2xl shadow-lg border border-gray-200 p-6 ${isLoading && initialQuery ? 'opacity-50 pointer-events-none' : ''}`}>
        {/* Title area */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">🤖</span>
          <h3 className="text-lg font-bold text-gray-900">AI Rental Code Finder</h3>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-5">
          Tell me your company and rental brand — I&apos;ll recommend the best corporate code for you.
        </p>

        {/* Search input form */}
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            disabled={isLoading}
            placeholder="e.g. Hertz discount for IBM employees"
            className="flex-1 px-4 py-3 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-800 bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-4 sm:px-6 py-3 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap shrink-0 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </span>
            ) : (
              'Ask AI'
            )}
          </button>
        </form>

        {/* Suggestions */}
        <div className="mt-4 flex items-start gap-2 text-xs text-gray-500">
          <span className="text-yellow-500">💡</span>
          <div className="flex flex-wrap gap-1">
            <span>Try:</span>
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => {
                  if (!isLoading) {
                    setQuery(suggestion);
                    triggerSearch(suggestion);
                  }
                }}
                disabled={isLoading}
                className="text-gray-400 hover:text-indigo-600 transition-colors disabled:cursor-not-allowed"
              >
                {suggestion}{index < suggestions.length - 1 ? ' · ' : ''}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Dropdown suggestions list */}
      {isOpen && (query.length > 0 || filteredCompanies.length > 0) && !isLoading && (
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

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
