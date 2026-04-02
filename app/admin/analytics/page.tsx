'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface AnalyticsConfig {
  id: string;
  measurementId: string;
  isEnabled: boolean;
  anonymizeIp: boolean;
  excludeAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

// 默认配置
const defaultConfig: AnalyticsConfig = {
  id: '',
  measurementId: 'G-801N4HE033',
  isEnabled: false,
  anonymizeIp: true,
  excludeAdmin: true,
  createdAt: '',
  updatedAt: '',
};

export default function AnalyticsPage() {
  const [config, setConfig] = useState<AnalyticsConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/admin/analytics');
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      } else {
        setConfig(defaultConfig);
      }
    } catch (error) {
      console.error('Failed to fetch config:', error);
      setConfig(defaultConfig);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setSaving(true);
    setMessage('');

    try {
      const res = await fetch('/api/admin/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          measurementId: config.measurementId,
          isEnabled: config.isEnabled,
          anonymizeIp: config.anonymizeIp,
          excludeAdmin: config.excludeAdmin,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setConfig(data);
        setMessage('✅ 配置保存成功！');
      } else {
        const errorData = await res.json();
        setMessage(`❌ 保存失败：${errorData.error || '请重试'}`);
      }
    } catch (error) {
      setMessage('❌ 保存失败，请检查网络连接');
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (field: keyof AnalyticsConfig, value: string | boolean) => {
    setConfig(prev => ({ ...prev, [field]: value }));
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
    <div className="p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Google Analytics 管理</h1>
        <p className="text-gray-600 mt-1">配置 GA4 网站流量统计</p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${message.includes('✅') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Measurement ID */}
          <div>
            <label htmlFor="measurementId" className="block text-sm font-medium text-gray-700 mb-2">
              GA4 Measurement ID
            </label>
            <input
              id="measurementId"
              type="text"
              value={config.measurementId}
              onChange={(e) => updateConfig('measurementId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="G-XXXXXXXXXX"
            />
            <p className="text-xs text-gray-500 mt-1">
              格式：G-801N4HE033（在 GA4 后台获取）
            </p>
          </div>

          {/* 全局开关 */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                启用 Google Analytics
              </label>
              <p className="text-xs text-gray-500 mt-1">
                开启后网站将加载 GA4 跟踪代码，开始统计访问数据
              </p>
            </div>
            <button
              type="button"
              onClick={() => updateConfig('isEnabled', !config.isEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${config.isEnabled ? 'bg-blue-600' : 'bg-gray-200'}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.isEnabled ? 'translate-x-6' : 'translate-x-1'}`}
              />
            </button>
          </div>

          {/* IP 匿名化 */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                IP 匿名化
              </label>
              <p className="text-xs text-gray-500 mt-1">
                开启后 GA4 将匿名化用户 IP 地址，符合 GDPR 等隐私法规要求
              </p>
            </div>
            <button
              type="button"
              onClick={() => updateConfig('anonymizeIp', !config.anonymizeIp)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${config.anonymizeIp ? 'bg-blue-600' : 'bg-gray-200'}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.anonymizeIp ? 'translate-x-6' : 'translate-x-1'}`}
              />
            </button>
          </div>

          {/* 排除管理员 */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                排除管理员访问
              </label>
              <p className="text-xs text-gray-500 mt-1">
                开启后已登录管理员的操作不会被统计，避免数据污染
              </p>
            </div>
            <button
              type="button"
              onClick={() => updateConfig('excludeAdmin', !config.excludeAdmin)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${config.excludeAdmin ? 'bg-blue-600' : 'bg-gray-200'}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.excludeAdmin ? 'translate-x-6' : 'translate-x-1'}`}
              />
            </button>
          </div>

          {/* 保存按钮 */}
          <div className="flex items-center gap-4 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {saving ? '保存中...' : '保存配置'}
            </button>
            <Link
              href="/admin"
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              返回后台
            </Link>
          </div>
        </form>
      </div>

      {/* 使用说明 */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-3">使用说明</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
          <li>确保你已经在 <a href="https://analytics.google.com" target="_blank" rel="noopener noreferrer" className="underline">Google Analytics</a> 创建数据流并获取 Measurement ID</li>
          <li>输入你的 GA4 Measurement ID（格式：G-XXXXXXXXXX）</li>
          <li>开启"启用 Google Analytics"开关，保存配置</li>
          <li>访问你的网站，确认 GA4 代码已加载（查看页面源代码搜索 gtag）</li>
          <li>返回 GA4 后台，在"实时"报告中查看是否有数据流入</li>
          <li>建议开启"IP 匿名化"以符合隐私法规要求</li>
        </ol>
      </div>
    </div>
  );
}
