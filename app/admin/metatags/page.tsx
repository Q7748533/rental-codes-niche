'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface MetaTag {
  id: string;
  name: string;
  content: string;
  isEnabled: boolean;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function MetaTagsPage() {
  const [metaTags, setMetaTags] = useState<MetaTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [editingTag, setEditingTag] = useState<MetaTag | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    content: '',
    description: '',
    isEnabled: true
  });

  useEffect(() => {
    fetchMetaTags();
  }, []);

  const fetchMetaTags = async () => {
    try {
      const res = await fetch('/api/admin/metatags');
      if (res.ok) {
        const data = await res.json();
        setMetaTags(data);
      }
    } catch (error) {
      console.error('Failed to fetch meta tags:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const res = await fetch('/api/admin/metatags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          id: editingTag?.id
        })
      });

      if (res.ok) {
        setMessage(editingTag ? '✅ 更新成功！' : '✅ 创建成功！');
        setFormData({ name: '', content: '', description: '', isEnabled: true });
        setEditingTag(null);
        fetchMetaTags();
      } else {
        const error = await res.json();
        setMessage(`❌ ${error.error || '保存失败'}`);
      }
    } catch (error) {
      setMessage('❌ 保存失败，请检查网络');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个 Meta 标签吗？')) return;

    try {
      const res = await fetch(`/api/admin/metatags?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMessage('✅ 删除成功！');
        fetchMetaTags();
      } else {
        setMessage('❌ 删除失败');
      }
    } catch (error) {
      setMessage('❌ 删除失败');
    }
  };

  const handleEdit = (tag: MetaTag) => {
    setEditingTag(tag);
    setFormData({
      name: tag.name,
      content: tag.content,
      description: tag.description || '',
      isEnabled: tag.isEnabled
    });
  };

  const handleCancel = () => {
    setEditingTag(null);
    setFormData({ name: '', content: '', description: '', isEnabled: true });
    setMessage('');
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
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Meta 标签管理</h1>
        <p className="text-gray-600">管理网站验证标签（如 admitad、Google Search Console 等）</p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${message.includes('✅') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message}
        </div>
      )}

      {/* 添加/编辑表单 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {editingTag ? '编辑 Meta 标签' : '添加新 Meta 标签'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Meta Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="如: verify-admitad, google-site-verification"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <p className="text-xs text-gray-500 mt-1">meta 标签的 name 属性</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Content <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="如: 155fd40ba8"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <p className="text-xs text-gray-500 mt-1">meta 标签的 content 属性</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">备注说明</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="如: Admitad 联盟验证"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isEnabled"
              checked={formData.isEnabled}
              onChange={(e) => setFormData({ ...formData, isEnabled: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="isEnabled" className="text-sm font-medium text-gray-700">
              启用此标签
            </label>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? '保存中...' : editingTag ? '更新' : '创建'}
            </button>
            {editingTag && (
              <button
                type="button"
                onClick={handleCancel}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-6 rounded-lg transition-colors"
              >
                取消
              </button>
            )}
          </div>
        </form>
      </div>

      {/* 标签列表 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">已配置的 Meta 标签</h2>
        </div>
        {metaTags.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            暂无 Meta 标签，请添加一个
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {metaTags.map((tag) => (
              <div key={tag.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-gray-800">
                        &lt;meta name="{tag.name}" content="{tag.content}" /&gt;
                      </code>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${tag.isEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {tag.isEnabled ? '已启用' : '已禁用'}
                      </span>
                    </div>
                    {tag.description && (
                      <p className="text-sm text-gray-600 mb-2">{tag.description}</p>
                    )}
                    <p className="text-xs text-gray-400">
                      更新于: {new Date(tag.updatedAt).toLocaleString('zh-CN')}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleEdit(tag)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-1 rounded hover:bg-blue-50 transition-colors"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleDelete(tag.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium px-3 py-1 rounded hover:bg-red-50 transition-colors"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 使用说明 */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">使用说明</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>• 添加的 Meta 标签会自动插入到所有页面的 &lt;head&gt; 中</li>
          <li>• 常用验证标签：verify-admitad, google-site-verification, msvalidate.01, yandex-verification</li>
          <li>• 只有启用的标签才会显示在网站上</li>
          <li>• 每个 name 只能有一个标签，重复会覆盖</li>
        </ul>
      </div>
    </div>
  );
}
