'use client';

import { useState, useMemo } from 'react';

interface Code {
  id: string;
  codeValue: string;
  codeType: string | null;
  description: string | null;
  source: string | null;
  company: {
    name: string;
    slug: string;
  };
}

interface BrandCodeListProps {
  codes: Code[];
  brandName: string;
}

export default function BrandCodeList({ codes, brandName }: BrandCodeListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'business' | 'leisure'>('all');

  const filteredCodes = useMemo(() => {
    return codes.filter((code) => {
      const matchesSearch =
        code.company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        code.codeValue.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (code.description && code.description.toLowerCase().includes(searchTerm.toLowerCase()));

      const codeType = code.codeType?.toLowerCase() || 'business';
      const matchesType = filterType === 'all' || codeType === filterType;

      return matchesSearch && matchesType;
    });
  }, [codes, searchTerm, filterType]);

  if (codes.length === 0) {
    return (
      <div className="bg-gray-50 rounded-2xl border border-dashed border-gray-300 p-12 text-center">
        <p className="text-gray-500">No codes available for {brandName} at this time.</p>
        <p className="text-sm mt-2">Check back later or browse other brands.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 搜索和筛选栏 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder={`Search ${brandName} codes...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                filterType === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType('business')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                filterType === 'business'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Business
            </button>
            <button
              onClick={() => setFilterType('leisure')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                filterType === 'leisure'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Leisure
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-500">
          Showing {filteredCodes.length} of {codes.length} codes
        </p>
      </div>

      {/* 代码列表 */}
      <div className="grid gap-4">
        {filteredCodes.map((code) => (
          <div
            key={code.id}
            className="bg-white p-5 md:p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-bold text-gray-900 text-lg">{code.company.name}</h3>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                    code.codeType?.toLowerCase() === 'leisure'
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}
                >
                  {code.codeType || 'Business'}
                </span>
                {code.source && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                    {code.source}
                  </span>
                )}
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">
                {code.description || `Corporate discount code for ${code.company.name}.`}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div
                className={`font-mono font-bold text-xl px-6 py-3 rounded-xl min-w-[140px] text-center select-all cursor-copy transition-colors ${
                  code.codeType?.toLowerCase() === 'leisure'
                    ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                    : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                }`}
                title="Click to copy"
                onClick={() => {
                  navigator.clipboard.writeText(code.codeValue);
                }}
              >
                {code.codeValue}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredCodes.length === 0 && (
        <div className="bg-gray-50 rounded-2xl border border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-500">No codes match your search criteria.</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterType('all');
            }}
            className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
