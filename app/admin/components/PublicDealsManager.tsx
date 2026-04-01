'use client';

import { useState } from 'react';
import { PublicDeal } from '@prisma/client';

interface PublicDealsManagerProps {
  deals: PublicDeal[];
  createAction: (formData: FormData) => Promise<void>;
  updateAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
}

export default function PublicDealsManager({ 
  deals, 
  createAction, 
  updateAction, 
  deleteAction 
}: PublicDealsManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async (formData: FormData) => {
    await createAction(formData);
    setIsCreating(false);
  };

  const handleUpdate = async (formData: FormData) => {
    await updateAction(formData);
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除这个优惠链接吗？')) {
      const formData = new FormData();
      formData.append('id', id);
      await deleteAction(formData);
    }
  };

  return (
    <div className="space-y-6">
      {/* 创建按钮 */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-900">公开优惠链接管理</h3>
        <button
          onClick={() => setIsCreating(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium shadow transition-colors"
        >
          + 添加新链接
        </button>
      </div>

      {/* 创建表单 */}
      {isCreating && (
        <form action={handleCreate} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-4">添加新优惠链接</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">标题</label>
              <input
                type="text"
                name="title"
                required
                placeholder="如：Discover Cars Price Comparison"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">链接地址</label>
              <input
                type="url"
                name="linkUrl"
                required
                placeholder="https://..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
              <input
                type="text"
                name="description"
                required
                placeholder="简短描述..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">按钮文字</label>
              <input
                type="text"
                name="buttonText"
                required
                defaultValue="Compare Prices"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">排序</label>
              <input
                type="number"
                name="sortOrder"
                defaultValue={0}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium"
            >
              保存
            </button>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded text-sm font-medium"
            >
              取消
            </button>
          </div>
        </form>
      )}

      {/* 列表 */}
      <div className="space-y-4">
        {deals.length === 0 ? (
          <p className="text-gray-500 text-center py-8">暂无公开优惠链接</p>
        ) : (
          deals.map((deal) => (
            <div key={deal.id} className="bg-white border border-gray-200 rounded-lg p-4">
              {editingId === deal.id ? (
                // 编辑表单
                <form action={handleUpdate} className="space-y-4">
                  <input type="hidden" name="id" value={deal.id} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">标题</label>
                      <input
                        type="text"
                        name="title"
                        defaultValue={deal.title}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">链接地址</label>
                      <input
                        type="url"
                        name="linkUrl"
                        defaultValue={deal.linkUrl}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                      <input
                        type="text"
                        name="description"
                        defaultValue={deal.description}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">按钮文字</label>
                      <input
                        type="text"
                        name="buttonText"
                        defaultValue={deal.buttonText}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">排序</label>
                      <input
                        type="number"
                        name="sortOrder"
                        defaultValue={deal.sortOrder}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="isActive"
                        defaultChecked={deal.isActive}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm text-gray-700">启用</span>
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium"
                    >
                      保存修改
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded text-sm font-medium"
                    >
                      取消
                    </button>
                  </div>
                </form>
              ) : (
                // 显示模式
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-gray-900">{deal.title}</h4>
                      <span className={`px-2 py-1 text-xs rounded ${deal.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                        {deal.isActive ? '启用' : '禁用'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{deal.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>链接: {deal.linkUrl}</span>
                      <span>按钮: {deal.buttonText}</span>
                      <span>排序: {deal.sortOrder}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => setEditingId(deal.id)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleDelete(deal.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      删除
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
