import { prisma } from '@/lib/db';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminOverview() {
  const [totalCodes, totalBrands, totalCompanies, totalPublicDeals] = await Promise.all([
    prisma.code.count(),
    prisma.brand.count(),
    prisma.company.count(),
    prisma.publicDeal.count(),
  ]);

  const recentCodes = await prisma.code.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      brand: true,
      company: true,
    },
  });

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">概览</h2>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Link href="/admin/codes" className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500 hover:shadow-md transition-shadow">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">总代码数</h3>
          <p className="mt-2 text-3xl font-extrabold text-gray-900">{totalCodes}</p>
        </Link>
        <Link href="/admin/brands" className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500 hover:shadow-md transition-shadow">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">品牌数量</h3>
          <p className="mt-2 text-3xl font-extrabold text-gray-900">{totalBrands}</p>
        </Link>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">公司数量</h3>
          <p className="mt-2 text-3xl font-extrabold text-gray-900">{totalCompanies}</p>
        </div>
        <Link href="/admin/deals" className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500 hover:shadow-md transition-shadow">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">公开优惠</h3>
          <p className="mt-2 text-3xl font-extrabold text-gray-900">{totalPublicDeals}</p>
        </Link>
      </div>

      {/* 最近添加的代码 */}
      <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-bold leading-6 text-gray-900">最近添加的代码</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {recentCodes.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              暂无代码数据
            </div>
          ) : (
            recentCodes.map((code) => (
              <div key={code.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {code.brand.name} - {code.company.name}
                  </p>
                  <p className="text-sm text-gray-500 font-mono">{code.codeValue}</p>
                </div>
                <span className="text-xs text-gray-400">
                  {code.createdAt.toLocaleDateString('zh-CN')}
                </span>
              </div>
            ))
          )}
        </div>
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
          <Link href="/admin/codes" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            查看全部 →
          </Link>
        </div>
      </div>
    </div>
  );
}
