'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface Company {
  name: string;
  slug: string;
}

interface AskAiWidgetProps {
  companies: Company[];
}

interface GenerationTask {
  query: string;
  taskId?: string; // 🚀 新增：任务ID用于精确轮询
  status: 'generating' | 'completed' | 'error';
  slug?: string;
  summary?: string;
  startTime: number;
}

export default function AskAiWidget({ companies }: AskAiWidgetProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiSlug, setAiSlug] = useState<string | null>(null);
  
  // 异步生成任务状态
  const [activeTask, setActiveTask] = useState<GenerationTask | null>(null);
  const [showToast, setShowToast] = useState(false);

  // 根据输入过滤公司
  const filteredCompanies = query.length > 0
    ? companies.filter(c =>
        c.name.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5)
    : [];

  // 轮询检查生成状态 - 🚀 使用 taskId 精确轮询
  const pollGenerationStatus = useCallback(async (taskId: string) => {
    const checkStatus = async () => {
      try {
        // 🚀 使用 taskId 精确查询，避免冲突
        const response = await fetch(`/api/ask/status?id=${encodeURIComponent(taskId)}`);
        if (response.ok) {
          const data = await response.json();

          // 🚀 1. 成功态：生成完成
          if (data.found && data.slug) {
            setActiveTask(prev => prev ? {
              ...prev,
              status: 'completed',
              slug: data.slug,
              summary: data.summary
            } : null);
            setShowToast(true);
            setIsLoading(false);
            return true; // 停止轮询
          }

          // 🚀 2. 失败态：后端判定任务超时或失败
          if (data.isFailed) {
            setActiveTask(prev => prev ? { ...prev, status: 'error' } : null);
            setAiResponse(data.error || 'Generation failed. Please try again.');
            setIsLoading(false);
            return true; // 停止轮询
          }
        }
        return false; // 继续轮询
      } catch (error) {
        console.error('Poll error:', error);
        return false;
      }
    };

    // 🚀 每 2 秒检查一次（降低频率保护数据库），最多检查 100 次（3分20秒）
    let attempts = 0;
    const maxAttempts = 100;

    const poll = async () => {
      if (attempts >= maxAttempts) {
        setActiveTask(prev => prev ? { ...prev, status: 'error' } : null);
        setAiResponse('Generation timeout. Please try again.');
        setIsLoading(false);
        return;
      }

      attempts++;
      const completed = await checkStatus();

      if (!completed && activeTask?.status === 'generating') {
        setTimeout(poll, 2000); // 🚀 2秒间隔，降低数据库压力
      }
    };

    poll();
  }, [activeTask?.status]);

  // 处理 AI 查询 - 异步生成
  const handleAskAI = async () => {
    if (!query.trim()) {
      alert('Please enter your question first');
      return;
    }

    const queryText = query.trim();
    setIsLoading(true);
    setAiResponse(null);
    setAiSlug(null);
    
    // 创建生成任务
    const task: GenerationTask = {
      query: queryText,
      status: 'generating',
      startTime: Date.now()
    };
    setActiveTask(task);

    try {
      // 启动异步生成
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: queryText }),
      });

      if (!response.ok) {
        throw new Error('Failed to start generation');
      }

      const data = await response.json();

      if (data.error) {
        setActiveTask(prev => prev ? { ...prev, status: 'error' } : null);
        setAiResponse(data.error);
        setIsLoading(false);
      } else if (data.taskId) {
        // 🚀 保存 taskId 并开始轮询
        setActiveTask(prev => prev ? { ...prev, taskId: data.taskId } : null);
        pollGenerationStatus(data.taskId);
      } else {
        // 兼容旧逻辑（如果有 slug 直接返回）
        setActiveTask(prev => prev ? {
          ...prev,
          status: 'completed',
          slug: data.slug,
          summary: data.summary
        } : null);
        setAiResponse(data.summary);
        setAiSlug(data.slug);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('AI Query Error:', error);
      setActiveTask(prev => prev ? { ...prev, status: 'error' } : null);
      setAiResponse('Sorry, something went wrong. Please try again later.');
      setIsLoading(false);
    }
  };

  // 清除任务
  const clearTask = () => {
    setActiveTask(null);
    setShowToast(false);
  };

  // 计算已用时间
  const getElapsedTime = () => {
    if (!activeTask) return 0;
    return Math.floor((Date.now() - activeTask.startTime) / 1000);
  };

  // 示例提示
  const suggestions = [
    '"Best Hertz code for IBM employees"',
    '"Enterprise discount for AAA members"',
    '"Avis corporate rate in Los Angeles"'
  ];

  return (
    <div className="relative">
      {/* Toast 通知 */}
      {showToast && activeTask?.status === 'completed' && (
        <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
          <div className="bg-green-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="font-semibold">Guide Ready!</p>
              <p className="text-sm text-green-100">Click to view the full guide</p>
            </div>
            {activeTask.slug && (
              <Link
                href={`/ask/${activeTask.slug}`}
                onClick={clearTask}
                className="ml-4 bg-white text-green-600 px-4 py-2 rounded-lg font-medium hover:bg-green-50 transition-colors"
              >
                View →
              </Link>
            )}
            <button
              onClick={clearTask}
              className="ml-2 text-green-200 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* 生成状态卡片 */}
      {activeTask?.status === 'generating' && (
        <div className="mb-4 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                <span className="text-xl">🤖</span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-indigo-500 rounded-full border-2 border-white animate-ping"></div>
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">Generating your personalized guide...</p>
              <p className="text-sm text-gray-600">
                Topic: {activeTask.query}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                ⏱️ {getElapsedTime()}s elapsed · Est. 30-60s
              </p>
            </div>
            <button
              onClick={clearTask}
              className="text-gray-400 hover:text-gray-600 p-2"
              title="Dismiss"
            >
              ✕
            </button>
          </div>
          <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-indigo-500 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${Math.min((getElapsedTime() / 60) * 100, 90)}%` }}
            ></div>
          </div>
        </div>
      )}

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
            disabled={isLoading}
            placeholder="e.g. Hertz discount for IBM employees"
            className="flex-1 px-4 py-3 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-800 bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <button
            type="button"
            onClick={handleAskAI}
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
                onClick={() => !isLoading && setQuery(suggestion.replace(/"/g, ''))}
                disabled={isLoading}
                className="text-gray-400 hover:text-indigo-600 transition-colors disabled:cursor-not-allowed"
              >
                {suggestion}{index < suggestions.length - 1 ? ' · ' : ''}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 下拉建议列表 */}
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
