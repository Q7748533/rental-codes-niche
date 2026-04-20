'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Article {
  slug: string;
  seoTitle: string;
  ga4PageViews: number;
  ga4BounceRate: number | null;
  ga4AvgDuration: number | null;
  isHighPerformer: boolean;
  lastAnalyzed: string | null;
}

interface SearchQuery {
  id: string;
  query: string;
  weight: number;
  successCount: number;
  failCount: number;
  totalTraffic: number;
  isActive: boolean;
}

interface AIAnalysis {
  titleAnalysis: string;
  userIntentAnalysis: string;
  contentPatterns: string;
}

interface LearnResult {
  patterns: {
    titlePatterns: {
      hasYear: number;
      hasVerified: number;
      hasBrand: number;
      hasLocation: number;
      avgLength: number;
    };
    queryPatterns: {
      commonWords: string[];
      avgLength: number;
    };
    performance: {
      avgPageViews: number;
      avgBounceRate: number;
      avgDuration: number;
    };
  } | null;
  aiAnalysis: AIAnalysis | null;
  suggestions: string[];
  highPerformerCount: number;
  message?: string;
}

interface Stats {
  overview: {
    totalArticles: number;
    articlesWithTraffic: number;
    highPerformerCount: number;
    totalPageViews: number;
    avgBounceRate: number;
  };
  recentArticles: Article[];
  topArticles: Article[];
  searchQueries: {
    total: number;
    totalSuccess: number;
    totalFail: number;
    topQueries: SearchQuery[];
  };
}

export default function GA4Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [learnResult, setLearnResult] = useState<LearnResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [learning, setLearning] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchStats();
    fetchLearnResult();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/ga4/stats');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setStats(data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLearnResult = async () => {
    try {
      const res = await fetch('/api/admin/ga4/learn');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setLearnResult(data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch learn result:', error);
    }
  };

  const handleLearn = async () => {
    setLearning(true);
    await fetchLearnResult();
    setLearning(false);
  };

  const handleSync = async () => {
    setSyncing(true);
    setMessage('');
    
    try {
      const res = await fetch('/api/admin/ga4/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await res.json();
      
      if (data.success) {
        setMessage(`✅ 同步成功！更新 ${data.message}，跳过 ${data.skipped} 篇`);
        fetchStats(); // 刷新数据
      } else {
        setMessage(`❌ 同步失败: ${data.error}`);
      }
    } catch (error: any) {
      setMessage(`❌ 请求失败: ${error.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}分${secs}秒`;
  };

  const formatBounceRate = (rate: number | null) => {
    if (rate === null) return '-';
    return `${(rate * 100).toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">GA4 数据分析</h1>
          <p className="text-gray-600">AI 自学习系统数据看板</p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {syncing ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              同步中...
            </>
          ) : (
            <>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              同步 GA4 数据
            </>
          )}
        </button>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${message.includes('✅') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message}
        </div>
      )}

      {stats && (
        <>
          {/* 概览卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <p className="text-sm font-medium text-gray-600 mb-1">总文章数</p>
              <p className="text-3xl font-bold text-gray-900">{stats.overview.totalArticles}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <p className="text-sm font-medium text-gray-600 mb-1">有流量文章</p>
              <p className="text-3xl font-bold text-blue-600">{stats.overview.articlesWithTraffic}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <p className="text-sm font-medium text-gray-600 mb-1">高表现文章</p>
              <p className="text-3xl font-bold text-green-600">{stats.overview.highPerformerCount}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <p className="text-sm font-medium text-gray-600 mb-1">总浏览量</p>
              <p className="text-3xl font-bold text-purple-600">{stats.overview.totalPageViews.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <p className="text-sm font-medium text-gray-600 mb-1">平均跳出率</p>
              <p className="text-3xl font-bold text-orange-600">{formatBounceRate(stats.overview.avgBounceRate)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 最近更新文章 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">最近更新文章</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {stats.recentArticles.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">暂无数据</div>
                ) : (
                  stats.recentArticles.map((article) => (
                    <div key={article.slug} className="p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <Link 
                            href={`/ask/${article.slug}`}
                            className="text-blue-600 hover:text-blue-800 font-medium truncate block"
                            target="_blank"
                          >
                            {article.seoTitle}
                          </Link>
                          <p className="text-xs text-gray-500 mt-1 truncate">{article.slug}</p>
                        </div>
                        <div className="ml-4 text-right">
                          <span className="text-lg font-bold text-gray-900">{article.ga4PageViews}</span>
                          <span className="text-xs text-gray-500 block">浏览</span>
                        </div>
                      </div>
                      <div className="flex gap-4 mt-2 text-xs text-gray-500">
                        <span>跳出率: {formatBounceRate(article.ga4BounceRate)}</span>
                        <span>停留: {formatDuration(article.ga4AvgDuration)}</span>
                        {article.isHighPerformer && (
                          <span className="text-green-600 font-medium">🔥 高表现</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 搜索词统计 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">搜索词权重 TOP5</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {stats.searchQueries.topQueries.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">暂无搜索词数据</div>
                ) : (
                  stats.searchQueries.topQueries.map((query) => (
                    <div key={query.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{query.query}</p>
                          <div className="flex gap-4 mt-1 text-xs text-gray-500">
                            <span>成功: {query.successCount}</span>
                            <span>失败: {query.failCount}</span>
                            <span>流量: {query.totalTraffic}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-lg font-bold ${query.weight >= 1.5 ? 'text-green-600' : query.weight >= 1.0 ? 'text-blue-600' : 'text-gray-600'}`}>
                            {query.weight.toFixed(2)}
                          </span>
                          <span className="text-xs text-gray-500 block">权重</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-600">
                总搜索词: {stats.searchQueries.total} | 
                成功: {stats.searchQueries.totalSuccess} | 
                失败: {stats.searchQueries.totalFail}
              </div>
            </div>
          </div>

          {/* 高表现文章 */}
          {stats.topArticles.length > 0 && (
            <div className="mt-8 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl shadow-sm border border-green-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-green-200">
                <h2 className="text-xl font-semibold text-green-900">🏆 高表现文章 TOP5</h2>
              </div>
              <div className="divide-y divide-green-100">
                {stats.topArticles.map((article, index) => (
                  <div key={article.slug} className="p-4 hover:bg-green-100/50">
                    <div className="flex items-center gap-4">
                      <span className="text-2xl font-bold text-green-600">#{index + 1}</span>
                      <div className="flex-1">
                        <Link 
                          href={`/ask/${article.slug}`}
                          className="text-green-800 hover:text-green-900 font-medium"
                          target="_blank"
                        >
                          {article.seoTitle}
                        </Link>
                        <p className="text-sm text-green-600 mt-1">{article.ga4PageViews.toLocaleString()} 次浏览</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 🧠 模式学习 */}
          <div className="mt-8 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl shadow-sm border border-purple-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-purple-200 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-purple-900">🧠 AI 模式学习</h2>
                <p className="text-sm text-purple-600 mt-1">分析高表现文章，生成推荐搜索词</p>
              </div>
              <button
                onClick={handleLearn}
                disabled={learning}
                className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {learning ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    学习中...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    开始分析
                  </>
                )}
              </button>
            </div>

            {learnResult && (
              <div className="p-6">
                {learnResult.message ? (
                  <div className="text-center text-purple-600 py-8">{learnResult.message}</div>
                ) : (
                  <>
                    {/* AI 深度分析 */}
                    {learnResult.aiAnalysis && (
                      <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                        <h3 className="text-lg font-semibold text-blue-900 mb-3">🤖 AI 深度分析</h3>
                        
                        <div className="space-y-3">
                          <div>
                            <h4 className="font-medium text-blue-800 text-sm mb-1">标题成功要素</h4>
                            <p className="text-sm text-gray-700 bg-white/70 rounded p-2">{learnResult.aiAnalysis.titleAnalysis}</p>
                          </div>
                          
                          <div>
                            <h4 className="font-medium text-blue-800 text-sm mb-1">用户意图分析</h4>
                            <p className="text-sm text-gray-700 bg-white/70 rounded p-2">{learnResult.aiAnalysis.userIntentAnalysis}</p>
                          </div>
                          
                          <div>
                            <h4 className="font-medium text-blue-800 text-sm mb-1">内容模式</h4>
                            <p className="text-sm text-gray-700 bg-white/70 rounded p-2">{learnResult.aiAnalysis.contentPatterns}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 学习到的模式 */}
                    {learnResult.patterns && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-purple-900 mb-4">📊 数据统计</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div className="bg-white rounded-lg p-3 text-center">
                            <p className="text-2xl font-bold text-purple-600">{learnResult.patterns.titlePatterns.hasYear}</p>
                            <p className="text-xs text-gray-600">含年份标题</p>
                          </div>
                          <div className="bg-white rounded-lg p-3 text-center">
                            <p className="text-2xl font-bold text-purple-600">{learnResult.patterns.titlePatterns.hasVerified}</p>
                            <p className="text-xs text-gray-600">含Verified/Active</p>
                          </div>
                          <div className="bg-white rounded-lg p-3 text-center">
                            <p className="text-2xl font-bold text-purple-600">{learnResult.patterns.titlePatterns.hasBrand}</p>
                            <p className="text-xs text-gray-600">含品牌名</p>
                          </div>
                          <div className="bg-white rounded-lg p-3 text-center">
                            <p className="text-2xl font-bold text-purple-600">{learnResult.patterns.titlePatterns.hasLocation}</p>
                            <p className="text-xs text-gray-600">含地点</p>
                          </div>
                        </div>
                        <div className="bg-white rounded-lg p-4">
                          <p className="text-sm text-gray-600 mb-2">常用关键词：</p>
                          <div className="flex flex-wrap gap-2">
                            {learnResult.patterns.queryPatterns.commonWords.map((word, i) => (
                              <span key={i} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                                {word}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 推荐搜索词 */}
                    {learnResult.suggestions.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-purple-900 mb-4">💡 推荐生成搜索词</h3>
                        <div className="bg-white rounded-lg p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {learnResult.suggestions.map((suggestion, i) => (
                              <div key={i} className="flex items-center justify-between bg-gray-50 rounded p-2">
                                <span className="text-sm text-gray-700">{suggestion}</span>
                                <Link
                                  href={`/admin/ai-articles?query=${encodeURIComponent(suggestion)}`}
                                  className="text-xs bg-purple-600 text-white px-2 py-1 rounded hover:bg-purple-700"
                                >
                                  生成
                                </Link>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
