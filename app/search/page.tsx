import { prisma } from '@/lib/db';
import Link from 'next/link';
import MobileNav from '@/components/MobileNav';

// 强制动态渲染，因为搜索词是实时变动的
export const dynamic = 'force-dynamic';

// Next.js 16: searchParams 是异步的
export async function generateMetadata({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const params = await searchParams;
  const query = params.q || '';
  return {
    title: query ? `Search Results for "${query}" | Car Corporate Codes` : 'Search | Car Corporate Codes',
    robots: { index: false, follow: true } // 关键 SEO：不要让 Google 索引搜索结果页本身，避免重复内容惩罚
  };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const query = params.q || '';

  // 1. 如果没有搜索词，直接返回空状态
  if (!query.trim()) {
    return <EmptySearchState message="Please enter a search term to find corporate codes." />;
  }

  // 2. 并发执行数据库搜索 (品牌、公司、具体代码)
  // 注意：SQLite 的 contains 默认忽略大小写，不需要加 mode: 'insensitive'
  const [brands, companies, codes] = await Promise.all([
    prisma.brand.findMany({
      where: { name: { contains: query } },
      include: { _count: { select: { codes: true } } },
      take: 8,
    }),
    prisma.company.findMany({
      where: { name: { contains: query } },
      include: { _count: { select: { codes: true } } },
      take: 12,
    }),
    prisma.code.findMany({
      where: {
        OR: [
          { codeValue: { contains: query } },
          { description: { contains: query } },
          // 如果用户搜 "IBM"，也匹配关联了 IBM 的代码
          { company: { name: { contains: query } } },
          { brand: { name: { contains: query } } }
        ]
      },
      include: { brand: true, company: true },
      take: 30, // 限制结果数量防暴击
    })
  ]);

  const totalResults = brands.length + companies.length + codes.length;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* 毛玻璃吸顶导航 */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/80 shadow-sm transition-all">
        <div className="max-w-6xl mx-auto px-4 py-3 md:py-4 flex justify-between items-center">
          <Link href="/" className="text-xl md:text-2xl font-bold text-blue-700">Car Corporate Codes</Link>
          <div className="flex items-center">
            <nav className="hidden md:flex items-center space-x-6 text-sm font-medium text-gray-600">
              <Link href="/#brands" className="hover:text-blue-600">Brands</Link>
              <Link href="/ask" className="hover:text-blue-600">Ask AI</Link>
            </nav>
            <MobileNav />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        {/* 搜索头部 */}
        <div className="mb-10">
          <Link href="/" className="text-blue-600 text-sm font-medium hover:underline mb-4 inline-block">&larr; Back to Home</Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Search Results for <span className="text-blue-600">"{query}"</span>
          </h1>
          <p className="text-gray-500 text-sm">Found {totalResults} matching results across our database.</p>
        </div>

        {totalResults === 0 ? (
          <EmptySearchState message={`No corporate codes found for "${query}". Try searching by company name like "IBM" or brand like "Hertz".`} />
        ) : (
          <div className="space-y-12">

            {/* 品牌匹配结果 */}
            {brands.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">Matching Rental Brands</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {brands.map(brand => (
                    <Link key={brand.id} href={`/${brand.slug}`} className="bg-white p-4 rounded-xl border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all text-center">
                      <h3 className="font-bold text-gray-900 capitalize">{brand.name}</h3>
                      <p className="text-xs text-gray-500 mt-1">{brand._count.codes} codes</p>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* 组织/公司匹配结果 */}
            {companies.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">Matching Organizations</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {companies.map(company => (
                    <Link key={company.id} href={`/organization/${company.slug}`} className="bg-white p-4 rounded-xl border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900 truncate pr-2">{company.name}</h3>
                      <span className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-md whitespace-nowrap">{company._count.codes} codes</span>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* 具体代码匹配结果 */}
            {codes.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">Matching Discount Codes</h2>
                <div className="space-y-4">
                  {codes.map(code => (
                    <div key={code.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-blue-300 transition-colors">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded capitalize font-medium">{code.brand.name}</span>
                          <span className="text-xs text-gray-400">&bull;</span>
                          <span className="text-sm font-semibold text-gray-900">{code.company.name}</span>
                        </div>
                        <p className="text-gray-600 text-sm leading-relaxed">{code.description || 'Corporate discount code. Terms apply.'}</p>
                      </div>
                      <div className="bg-blue-50 px-4 py-3 rounded-lg border border-blue-100 flex items-center justify-between min-w-[140px]">
                        <span className="font-mono font-bold text-blue-800 tracking-wider text-lg">{code.codeValue}</span>
                        <span className="text-[10px] uppercase font-bold text-blue-400 ml-3">Copy</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

          </div>
        )}

        {/* 底部引导转化去 AI 生成页 */}
        <div className="mt-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-8 text-center shadow-lg">
          <h3 className="text-2xl font-bold text-white mb-3">Didn&apos;t find what you need?</h3>
          <p className="text-blue-100 mb-6 max-w-lg mx-auto">Our AI agent can scan real-time databases and find the exact corporate codes for your specific airport and date.</p>
          <Link href={`/ask?q=${encodeURIComponent(query)}`} className="inline-block bg-white text-blue-700 font-bold px-8 py-3 rounded-xl shadow hover:bg-gray-50 transition-colors">
            Ask AI to Find It
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 mt-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h4 className="text-white font-bold mb-4">Car Corporate Codes</h4>
              <p className="text-sm text-gray-500">Verified database of corporate discount codes for major rental brands. Save 10-25% on your next rental.</p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
                <li><Link href="/ask" className="hover:text-white transition-colors">Ask AI</Link></li>
                <li><Link href="/search?q=" className="hover:text-white transition-colors">Search</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-500">
            <p>&copy; {new Date().getFullYear()} Car Corporate Codes. All rights reserved.</p>
            <p className="mt-2">Corporate codes require eligibility verification. Not affiliated with any rental companies.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// 空状态组件 - 包含完整页面布局
function EmptySearchState({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* 导航栏 */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/80 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 md:py-4 flex justify-between items-center">
          <Link href="/" className="text-xl md:text-2xl font-bold text-blue-700">Car Corporate Codes</Link>
          <div className="flex items-center">
            <nav className="hidden md:flex items-center space-x-6 text-sm font-medium text-gray-600">
              <Link href="/ask" className="hover:text-blue-600">Ask AI</Link>
            </nav>
            <MobileNav />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
          <div className="text-4xl mb-4">🔍</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">No results found</h2>
          <p className="text-gray-500 mb-6">{message}</p>
          <Link href="/" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-lg transition-colors inline-block">
            Return Home
          </Link>
        </div>
      </main>

      {/* 页脚 */}
      <footer className="bg-gray-900 text-gray-400 py-12 mt-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h4 className="text-white font-bold mb-4">Car Corporate Codes</h4>
              <p className="text-sm text-gray-500">Verified database of corporate discount codes for major rental brands.</p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
                <li><Link href="/ask" className="hover:text-white transition-colors">Ask AI</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-500">
            <p>&copy; {new Date().getFullYear()} Car Corporate Codes. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
