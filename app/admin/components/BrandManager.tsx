'use client';

import { useState } from 'react';

interface Brand {
  id: string;
  name: string;
  slug: string;
  defaultUrl: string | null;
  _count: {
    codes: number;
  };
}

interface BrandManagerProps {
  brands: Brand[];
  deleteAction: (formData: FormData) => void;
}

export default function BrandManager({ brands, deleteAction }: BrandManagerProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleDelete = (brandId: string) => {
    const formData = new FormData();
    formData.append('brandId', brandId);
    deleteAction(formData);
    setDeleteConfirm(null);
  };

  if (brands.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        暂无品牌数据
      </div>
    );
  }

  return (
    <div>
      {/* 品牌列表 */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">品牌名称</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Slug</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">默认链接</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">代码数量</th>
              <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {brands.map((brand) => (
              <tr key={brand.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{brand.name}</div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="text-sm text-gray-600 font-mono">/{brand.slug}</div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="text-sm text-gray-600 truncate max-w-xs">
                    {brand.defaultUrl ? (
                      <a href={brand.defaultUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {brand.defaultUrl}
                      </a>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {brand._count.codes} 个代码
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right">
                  {deleteConfirm === brand.id ? (
                    <div className="flex items-center justify-end space-x-2">
                      <span className="text-xs text-red-600">确认删除?</span>
                      <button
                        onClick={() => handleDelete(brand.id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-medium"
                      >
                        是
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-3 py-1 rounded text-xs font-medium"
                      >
                        否
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(brand.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      删除
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 提示信息 */}
      <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
        <p className="text-xs text-yellow-700">
          <strong>注意：</strong>删除品牌将同时删除该品牌下的所有优惠代码，此操作不可恢复。
        </p>
      </div>
    </div>
  );
}
