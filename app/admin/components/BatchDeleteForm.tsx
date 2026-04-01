'use client';

import { useState } from 'react';

interface Code {
  id: string;
  codeValue: string;
  description: string | null;
  brand: { name: string };
  company: { name: string };
}

interface BatchDeleteFormProps {
  codes: Code[];
  deleteAction: (formData: FormData) => void;
  batchDeleteAction: (formData: FormData) => void;
}

export default function BatchDeleteForm({ codes, deleteAction, batchDeleteAction }: BatchDeleteFormProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showConfirm, setShowConfirm] = useState(false);

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleAll = () => {
    if (selectedIds.size === codes.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(codes.map(c => c.id)));
    }
  };

  const handleBatchDelete = () => {
    if (selectedIds.size === 0) {
      alert('请先选择要删除的记录');
      return;
    }
    setShowConfirm(true);
  };

  const confirmDelete = () => {
    const formData = new FormData();
    formData.append('codeIds', Array.from(selectedIds).join(','));
    batchDeleteAction(formData);
    setShowConfirm(false);
    setSelectedIds(new Set());
  };

  if (codes.length === 0) {
    return (
      <div className="px-6 py-10 text-center text-gray-500 text-sm">
        数据库中暂无代码记录。请先运行爬虫导入数据！
      </div>
    );
  }

  return (
    <div>
      {/* 批量操作工具栏 */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedIds.size === codes.length && codes.length > 0}
              onChange={toggleAll}
              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">
              全选 ({selectedIds.size}/{codes.length})
            </span>
          </label>
        </div>
        {selectedIds.size > 0 && (
          <button
            onClick={handleBatchDelete}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
          >
            批量删除 ({selectedIds.size})
          </button>
        )}
      </div>

      {/* 数据表格 */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-3 w-10">
                <span className="sr-only">选择</span>
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">租车品牌</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">公司/组织</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">优惠代码</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">描述</th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {codes.map((code) => (
              <tr
                key={code.id}
                className={`hover:bg-gray-50 transition-colors ${selectedIds.has(code.id) ? 'bg-blue-50' : ''}`}
              >
                <td className="px-4 py-4">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(code.id)}
                    onChange={() => toggleSelection(code.id)}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                    {code.brand.name}
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900 capitalize">
                  {code.company.name}
                </td>
                <td className="px-4 py-4 whitespace-nowrap font-mono text-sm font-bold text-gray-700">
                  {code.codeValue}
                </td>
                <td className="px-4 py-4 text-sm text-gray-500 truncate max-w-xs">
                  {code.description || '-'}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <form action={deleteAction} className="inline-block">
                    <input type="hidden" name="codeId" value={code.id} />
                    <button
                      type="submit"
                      className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded transition-colors text-sm"
                      onClick={(e) => {
                        if (!confirm('确定要删除这条代码吗？')) {
                          e.preventDefault();
                        }
                      }}
                    >
                      删除
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 确认删除弹窗 */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">确认批量删除</h3>
            <p className="text-gray-600 mb-6">
              您确定要删除选中的 <strong>{selectedIds.size}</strong> 条记录吗？此操作不可撤销。
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
              >
                取消
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded transition-colors"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
