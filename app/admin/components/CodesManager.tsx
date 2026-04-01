'use client';

import { useState, useMemo } from 'react';

interface Code {
  id: string;
  codeValue: string;
  description: string | null;
  brand: { name: string };
  company: { name: string };
}

interface CodesManagerProps {
  codes: Code[];
  deleteAction: (formData: FormData) => void;
  batchDeleteAction: (formData: FormData) => void;
}

const ITEMS_PER_PAGE = 10;

export default function CodesManager({ codes, deleteAction, batchDeleteAction }: CodesManagerProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [batchDeleteConfirm, setBatchDeleteConfirm] = useState(false);

  // 分页计算
  const totalPages = Math.ceil(codes.length / ITEMS_PER_PAGE);
  const paginatedCodes = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return codes.slice(start, start + ITEMS_PER_PAGE);
  }, [codes, currentPage]);

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
    const currentPageIds = new Set(paginatedCodes.map(c => c.id));
    const allSelected = paginatedCodes.every(c => selectedIds.has(c.id));
    
    const newSelected = new Set(selectedIds);
    if (allSelected) {
      // 取消当前页所有选择
      currentPageIds.forEach(id => newSelected.delete(id));
    } else {
      // 选择当前页所有
      currentPageIds.forEach(id => newSelected.add(id));
    }
    setSelectedIds(newSelected);
  };

  const handleDelete = (codeId: string) => {
    const formData = new FormData();
    formData.append('codeId', codeId);
    deleteAction(formData);
    setDeleteConfirm(null);
  };

  const handleBatchDelete = () => {
    if (selectedIds.size === 0) return;
    const formData = new FormData();
    formData.append('codeIds', Array.from(selectedIds).join(','));
    batchDeleteAction(formData);
    setBatchDeleteConfirm(false);
    setSelectedIds(new Set());
  };

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  if (codes.length === 0) {
    return (
      <div className="px-6 py-10 text-center text-gray-500 text-sm">
        数据库中暂无代码记录
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
              checked={paginatedCodes.length > 0 && paginatedCodes.every(c => selectedIds.has(c.id))}
              onChange={toggleAll}
              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">
              全选本页 ({selectedIds.size} / {codes.length})
            </span>
          </label>
        </div>
        {selectedIds.size > 0 && (
          <button
            onClick={() => setBatchDeleteConfirm(true)}
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
              <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">适用公司</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">优惠代码</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">描述</th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedCodes.map((code) => (
              <tr key={code.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(code.id)}
                    onChange={() => toggleSelection(code.id)}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                  {code.brand.name}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                  {code.company.name}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-blue-600 bg-blue-50 rounded px-2 py-1 inline-block">
                  {code.codeValue}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                  {code.description || '-'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                  {deleteConfirm === code.id ? (
                    <div className="flex items-center justify-end space-x-2">
                      <span className="text-xs text-red-600">确认?</span>
                      <button
                        onClick={() => handleDelete(code.id)}
                        className="text-red-600 hover:text-red-800 font-medium"
                      >
                        是
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        否
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(code.id)}
                      className="text-red-600 hover:text-red-800 font-medium"
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

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            显示 {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, codes.length)} 条，共 {codes.length} 条
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              上一页
            </button>
            
            {/* 页码 */}
            <div className="flex space-x-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`w-8 h-8 rounded text-sm font-medium ${
                    page === currentPage
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              下一页
            </button>
          </div>
        </div>
      )}

      {/* 批量删除确认弹窗 */}
      {batchDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">确认批量删除</h3>
            <p className="text-sm text-gray-600 mb-4">
              确定要删除选中的 {selectedIds.size} 条记录吗？此操作不可恢复。
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setBatchDeleteConfirm(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded text-sm font-medium hover:bg-gray-300"
              >
                取消
              </button>
              <button
                onClick={handleBatchDelete}
                className="px-4 py-2 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700"
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
