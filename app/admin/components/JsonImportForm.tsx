'use client';

import { useState, useRef } from 'react';

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
  details: {
    brand: string;
    company: string;
    codeValue: string;
    status: 'success' | 'failed';
    error?: string;
  }[];
}

export default function JsonImportForm() {
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      setError('请选择 JSON 文件');
      return;
    }

    setFileName(file.name);
    setError(null);
    setResult(null);
  };

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError('请先选择 JSON 文件');
      return;
    }

    setIsUploading(true);
    setError(null);
    setResult(null);

    try {
      const text = await file.text();
      let jsonData;
      
      try {
        jsonData = JSON.parse(text);
      } catch {
        throw new Error('JSON 文件格式错误，无法解析');
      }

      // 确保是数组
      if (!Array.isArray(jsonData)) {
        throw new Error('JSON 文件必须是一个数组');
      }

      if (jsonData.length === 0) {
        throw new Error('JSON 数组为空');
      }

      // 验证数据格式
      const requiredFields = ['brand', 'company', 'codeValue'];
      const invalidItems = jsonData.filter((item, index) => {
        if (!item || typeof item !== 'object') {
          return true;
        }
        return requiredFields.some(field => !item[field] || typeof item[field] !== 'string');
      });

      if (invalidItems.length > 0) {
        throw new Error(`数据格式错误：第 ${jsonData.indexOf(invalidItems[0]) + 1} 条记录缺少必填字段（brand, company, codeValue）`);
      }

      // 发送请求
      const response = await fetch('/api/admin/import-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jsonData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '导入失败');
      }

      setResult(data);
      
      // 清空文件选择
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setFileName(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '导入过程中发生错误');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (fileInputRef.current) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInputRef.current.files = dataTransfer.files;
        handleFileSelect({ target: fileInputRef.current } as React.ChangeEvent<HTMLInputElement>);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* 文件上传区域 */}
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleFileSelect}
          className="hidden"
        />
        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <p className="mt-4 text-sm font-medium text-gray-900">
          {fileName ? fileName : '点击选择或拖拽 JSON 文件到此处'}
        </p>
        <p className="mt-1 text-xs text-gray-500">
          支持 .json 格式文件
        </p>
      </div>

      {/* 上传按钮 */}
      {fileName && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            已选择: <span className="font-medium">{fileName}</span>
          </p>
          <button
            onClick={handleUpload}
            disabled={isUploading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg text-sm font-medium shadow transition-colors flex items-center space-x-2"
          >
            {isUploading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>导入中...</span>
              </>
            ) : (
              <span>开始导入</span>
            )}
          </button>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">导入失败</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* 成功结果 */}
      {result && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-green-800">导入完成</h3>
              <div className="mt-2 text-sm text-green-700">
                <p>成功: {result.success} 条</p>
                {result.failed > 0 && <p>失败: {result.failed} 条</p>}
              </div>
              
              {/* 详细结果 */}
              {result.details.length > 0 && (
                <div className="mt-4 max-h-60 overflow-y-auto">
                  <table className="min-w-full divide-y divide-green-200">
                    <thead className="bg-green-100">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-green-800">品牌</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-green-800">公司</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-green-800">代码</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-green-800">状态</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-green-200">
                      {result.details.map((item, index) => (
                        <tr key={index} className={item.status === 'failed' ? 'bg-red-50' : ''}>
                          <td className="px-3 py-2 text-xs text-gray-900">{item.brand}</td>
                          <td className="px-3 py-2 text-xs text-gray-900">{item.company}</td>
                          <td className="px-3 py-2 text-xs text-gray-900 font-mono">{item.codeValue}</td>
                          <td className="px-3 py-2 text-xs">
                            {item.status === 'success' ? (
                              <span className="text-green-600 font-medium">✓ 成功</span>
                            ) : (
                              <span className="text-red-600 font-medium" title={item.error}>✗ 失败</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 错误列表 */}
              {result.errors.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-red-800">错误详情:</h4>
                  <ul className="mt-2 text-xs text-red-700 list-disc list-inside">
                    {result.errors.map((err, index) => (
                      <li key={index}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 数据格式说明 */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">JSON 文件格式要求:</h4>
        <pre className="text-xs text-gray-600 bg-gray-100 p-3 rounded overflow-x-auto">
{`[
  {
    "brand": "Hertz",
    "company": "AAA",
    "codeValue": "PC#211982",
    "description": "优惠描述（可选）",
    "codeType": "Leisure（可选）",
    "source": "Member（可选）"
  }
]`}
        </pre>
        <p className="text-xs text-gray-500 mt-2">
          必填字段: brand, company, codeValue | 可选字段: description, codeType, source
        </p>
      </div>
    </div>
  );
}
