'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Article {
  id: string;
  slug: string;
  userPrompt: string;
  aiSummary: string;
  seoTitle: string;
  seoContent: string;
  viewCount: number;
  createdAt: Date;
}

interface AiArticlesManagerProps {
  articles: Article[];
  deleteAction: (formData: FormData) => void;
  updateAction: (formData: FormData) => void;
}

export default function AiArticlesManager({ articles, deleteAction, updateAction }: AiArticlesManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    seoTitle: '',
    seoContent: '',
    aiSummary: '',
    slug: '',
  });

  const startEdit = (article: Article) => {
    setEditingId(article.id);
    setEditForm({
      seoTitle: article.seoTitle,
      seoContent: article.seoContent,
      aiSummary: article.aiSummary,
      slug: article.slug,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ seoTitle: '', seoContent: '', aiSummary: '', slug: '' });
  };

  const handleUpdate = (articleId: string) => {
    const formData = new FormData();
    formData.append('articleId', articleId);
    formData.append('seoTitle', editForm.seoTitle);
    formData.append('seoContent', editForm.seoContent);
    formData.append('aiSummary', editForm.aiSummary);
    formData.append('slug', editForm.slug);
    updateAction(formData);
    setEditingId(null);
  };

  const handleDelete = (articleId: string) => {
    const formData = new FormData();
    formData.append('articleId', articleId);
    deleteAction(formData);
    setDeleteConfirm(null);
  };

  if (articles.length === 0) {
    return (
      <div className="px-6 py-10 text-center text-gray-500">
        暂无 AI 生成文章
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      {articles.map((article) => (
        <div key={article.id} className="p-6 hover:bg-gray-50">
          {editingId === article.id ? (
            // 编辑模式
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SEO 标题</label>
                <input
                  type="text"
                  value={editForm.seoTitle}
                  onChange={(e) => setEditForm({ ...editForm, seoTitle: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">摘要</label>
                <textarea
                  value={editForm.aiSummary}
                  onChange={(e) => setEditForm({ ...editForm, aiSummary: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">内容 (HTML)</label>
                <textarea
                  value={editForm.seoContent}
                  onChange={(e) => setEditForm({ ...editForm, seoContent: e.target.value })}
                  rows={10}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => handleUpdate(article.id)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium"
                >
                  保存
                </button>
                <button
                  onClick={cancelEdit}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded text-sm font-medium"
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            // 查看模式
            <div>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="text-lg font-medium text-gray-900 truncate">
                    {article.seoTitle}
                  </h4>
                  <p className="text-sm text-gray-500 mt-1">
                    用户提问: {article.userPrompt}
                  </p>
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                    <span>浏览: {article.viewCount}</span>
                    <span>创建: {new Date(article.createdAt).toLocaleDateString('zh-CN')}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <Link
                    href={`/ask/${article.slug}`}
                    target="_blank"
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    查看
                  </Link>
                  <button
                    onClick={() => startEdit(article)}
                    className="text-green-600 hover:text-green-800 text-sm font-medium"
                  >
                    编辑
                  </button>
                  {deleteConfirm === article.id ? (
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-red-600">确认?</span>
                      <button
                        onClick={() => handleDelete(article.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        是
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="text-gray-500 hover:text-gray-700 text-sm"
                      >
                        否
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(article.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      删除
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
