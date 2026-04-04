'use client';

import { useState } from 'react';
import Link from 'next/link';

// 完美匹配爬虫的 6 字段
interface CodeItem {
  id: string;
  codeValue: string;
  description: string | null;
  codeType: string | null;
  source: string | null;
  company: { name: string };
}

export default function BrandCodeList({ codes, brandName, term }: { codes: CodeItem[], brandName: string, term: string }) {
  const [searchTerm, setSearchTerm] = useState('');

  // 强大的前端搜索引擎
  const filteredCodes = codes.filter(code => {
    const term = searchTerm.toLowerCase();
    return (
      code.company.name.toLowerCase().includes(term) ||
      code.codeValue.toLowerCase().includes(term) ||
      (code.codeType && code.codeType.toLowerCase().includes(term)) ||
      (code.source && code.source.toLowerCase().includes(term)) ||
      (code.description && code.description.toLowerCase().includes(term))
    );
  });

  return (
    <div className="w-full">
      {/* 丝滑的页内秒查搜索框 */}
      <div className="mb-8 relative max-w-2xl mx-auto">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
        </div>
        <input
          type="text"
          className="w-full pl-11 pr-4 py-4 bg-white border-2 border-blue-100 rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all text-gray-800 text-lg"
          placeholder={`Filter by company, code type, or source...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
          <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded">{filteredCodes.length} results</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        
        {/* 桌面端宽屏表格 */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-xs uppercase tracking-wider">
                <th className="p-5 font-bold w-1/5">Organization</th>
                <th className="p-5 font-bold w-1/6">Source</th>
                <th className="p-5 font-bold w-1/6">Business</th>
                <th className="p-5 font-bold w-1/6">Leisure</th>
                <th className="p-5 font-bold w-auto">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCodes.map((codeItem) => (
                <tr key={codeItem.id} className="hover:bg-blue-50/50 transition-colors">
                  <td className="p-5">
                    <Link 
                      href={`/ask?q=${encodeURIComponent(`How to use ${codeItem.company.name} corporate code for ${brandName} rentals`)}`}
                      className="font-bold text-gray-900 text-base hover:text-blue-600 hover:underline transition-colors"
                    >
                      {codeItem.company.name}
                    </Link>
                  </td>
                  <td className="p-5">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                      {codeItem.source || 'Employee'}
                    </span>
                  </td>
                  <td className="p-5">
                    {(!codeItem.codeType || codeItem.codeType.toLowerCase() === 'business') ? (
                      <code className="inline-block bg-blue-100 text-blue-800 font-mono font-bold px-3 py-1.5 rounded border border-blue-200 tracking-widest text-sm hover:bg-blue-200 cursor-copy transition-colors select-all" title="Copy code">
                        {codeItem.codeValue}
                      </code>
                    ) : <span className="text-gray-300 text-sm italic">N/A</span>}
                  </td>
                  <td className="p-5">
                    {codeItem.codeType?.toLowerCase() === 'leisure' ? (
                      <code className="inline-block bg-green-100 text-green-800 font-mono font-bold px-3 py-1.5 rounded border border-green-200 tracking-widest text-sm hover:bg-green-200 cursor-copy transition-colors select-all" title="Copy code">
                        {codeItem.codeValue}
                      </code>
                    ) : <span className="text-gray-300 text-sm italic">N/A</span>}
                  </td>
                  <td className="p-5 text-gray-600 text-sm leading-relaxed">
                    {(!codeItem.codeType || codeItem.codeType.toLowerCase() === 'business') ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-600 uppercase tracking-wider mr-2 border border-red-200">🚨 ID Required</span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-green-50 text-green-600 uppercase tracking-wider mr-2 border border-green-200">✅ Safe to Use</span>
                    )}
                    {codeItem.description || 'Standard rates apply.'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 移动端高转化率卡片布局 */}
        <div className="md:hidden divide-y divide-gray-100">
          {filteredCodes.map((codeItem) => (
            <div key={codeItem.id} className="p-5 hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-start mb-3">
                <Link 
                  href={`/ask?q=${encodeURIComponent(`How to use ${codeItem.company.name} corporate code for ${brandName} rentals`)}`}
                  className="font-bold text-gray-900 text-lg hover:text-blue-600 hover:underline transition-colors"
                >
                  {codeItem.company.name}
                </Link>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 uppercase tracking-wider border border-gray-200">
                  {codeItem.source || 'Employee'}
                </span>
              </div>
              
              <div className="flex flex-col space-y-2 mb-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                {(!codeItem.codeType || codeItem.codeType.toLowerCase() === 'business') && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 font-bold uppercase tracking-wide">Business:</span>
                    <code className="inline-block bg-blue-100 text-blue-800 font-mono font-bold px-3 py-1 rounded border border-blue-200 tracking-widest text-sm select-all">
                      {codeItem.codeValue}
                    </code>
                  </div>
                )}
                {codeItem.codeType?.toLowerCase() === 'leisure' && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 font-bold uppercase tracking-wide">Leisure:</span>
                    <code className="inline-block bg-green-100 text-green-800 font-mono font-bold px-3 py-1 rounded border border-green-200 tracking-widest text-sm select-all">
                      {codeItem.codeValue}
                    </code>
                  </div>
                )}
              </div>

              <div className="text-gray-600 text-sm leading-relaxed mt-2">
                {(!codeItem.codeType || codeItem.codeType.toLowerCase() === 'business') ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-600 uppercase tracking-wider mr-2 border border-red-200">🚨 ID Required</span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-green-50 text-green-600 uppercase tracking-wider mr-2 border border-green-200">✅ Safe to Use</span>
                )}
                {codeItem.description || 'Standard rates apply.'}
              </div>
            </div>
          ))}
        </div>

        {filteredCodes.length === 0 && (
          <div className="p-16 text-center text-gray-500">
            <div className="text-4xl mb-4">🔍</div>
            <p className="text-lg font-medium text-gray-900 mb-1">No matches found</p>
            <p className="text-sm">We couldn&apos;t find any codes matching &quot;{searchTerm}&quot;.</p>
          </div>
        )}
      </div>
    </div>
  );
}
