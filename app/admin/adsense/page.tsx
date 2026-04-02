'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface AdSenseConfig {
  id: string;
  publisherId: string;
  isEnabled: boolean;
  autoAdsEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

// 默认配置
const defaultConfig: AdSenseConfig = {
  id: '',
  publisherId: 'ca-pub-5289849412154503',
  isEnabled: false,
  autoAdsEnabled: true,
  createdAt: '',
  updatedAt: '',
};

export default function AdSensePage() {
  const [config, setConfig] = useState<AdSenseConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/admin/adsense');
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      } else {
        // 如果获取失败，使用默认配置
        setConfig(defaultConfig);
      }
    } catch (error) {
      console.error('Failed to fetch config:', error);
      // 如果获取失败，使用默认配置
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
      const res = await fetch('/api/admin/adsense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publisherId: config.publisherId,
          isEnabled: config.isEnabled,
          autoAdsEnabled: config.autoAdsEnabled,
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

  // 更新配置字段
  const updateConfig = (field: keyof AdSenseConfig, value: string | boolean) => {
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
        <h1 className="text-2xl font-bold text-gray-900">AdSense 广告管理</h1>
        <p className="text-gray-600 mt-1">配置 Google AdSense 自动广告</p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${message.includes('✅') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 发布商 ID */}
          <div>
            <label htmlFor="publisherId" className="block text-sm font-medium text-gray-700 mb-2">
              AdSense 发布商 ID
            </label>
            <input
              id="publisherId"
              type="text"
              value={config.publisherId}
              onChange={(e) => updateConfig('publisherId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="ca-pub-xxxxxxxxxxxxxxxx"
            />
            <p className="text-xs text-gray-500 mt-1">
              格式：ca-pub-5289849412154503
            </p>
          </div>

          {/* 全局开关 */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                启用 AdSense
              </label>
              <p className="text-xs text-gray-500 mt-1">
                开启后网站将加载 AdSense 代码，用于验证所有权和展示广告
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

          {/* Auto Ads 开关 */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                启用 Auto Ads（自动广告）
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Google 自动决定广告位置和类型，无需手动配置广告位
              </p>
            </div>
            <button
              type="button"
              onClick={() => updateConfig('autoAdsEnabled', !config.autoAdsEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${config.autoAdsEnabled ? 'bg-blue-600' : 'bg-gray-200'}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.autoAdsEnabled ? 'translate-x-6' : 'translate-x-1'}`}
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
          <li>确保你已经在 <a href="https://www.google.com/adsense" target="_blank" rel="noopener noreferrer" className="underline">Google AdSense</a> 注册并获取发布商 ID</li>
          <li>开启"启用 AdSense"开关，保存配置</li>
          <li>访问你的网站首页，确认 AdSense 代码已加载（查看页面源代码）</li>
          <li>返回 AdSense 后台，点击"我已放置代码"进行验证</li>
          <li>等待 Google 审核（通常需要 1-3 天）</li>
          <li>审核通过后，广告会自动开始展示</li>
        </ol>
      </div>
    </div>
  );
}
