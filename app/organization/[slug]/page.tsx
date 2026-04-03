import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import MobileNav from '@/components/MobileNav';

export const revalidate = 3600; // 缓存 1 小时

// 异步元数据生成 (SEO 核心)
export async function generateMetadata(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const company = await prisma.company.findUnique({
    where: { slug: params.slug },
    select: { name: true }
  });

  if (!company) {
    return { title: 'Organization Not Found | Car Corporate Codes' };
  }

  return {
    title: `${company.name} Car Rental Corporate Codes & Discounts (2026)`,
    description: `Verified ${company.name} corporate discount codes (CDP/AWD) for Hertz, Enterprise, Avis, and Budget. Save 10-25% on your business and leisure travel.`,
    alternates: {
      canonical: `https://carcorporatecodes.com/organization/${params.slug}`,
    }
  };
}

export default async function OrganizationPage(props: { params: Promise<{ slug: string }> }) {
  // 必须 await 解析异步 params
  const params = await props.params;

  // 数据库查询：获取该公司信息，以及关联的所有租车代码（并附带代码所属的品牌）
  const company = await prisma.company.findUnique({
    where: { slug: params.slug },
    include: {
      codes: {
        include: { brand: true },
        orderBy: { brandId: 'asc' } // 按租车品牌排序，视觉上更整齐
      }
    }
  });

  // 如果数据库里没这个公司，直接触发 404
  if (!company) {
    notFound();
  }

  // 构建结构化数据 (JSON-LD)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `${company.name} Car Rental Corporate Codes`,
    description: `Database of verified car rental codes for ${company.name} employees and members.`,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: company.codes.map((code, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: `${company.name} code for ${code.brand.name}`,
        description: code.description || `Discount code ${code.codeValue} for ${code.brand.name}`
      }))
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* 头部导航 */}
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

      <main className="max-w-4xl mx-auto px-4 py-8 md:py-16">
        {/* 面包屑导航 */}
        <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2">
          <Link href="/" className="hover:text-blue-600">Home</Link>
          <span>/</span>
          <Link href="/search?q=" className="hover:text-blue-600">Organizations</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">{company.name}</span>
        </nav>

        {/* H1 核心区域 */}
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-200 mb-12 text-center">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-3xl mb-6 border-4 border-white shadow-md">
            {company.name.charAt(0).toUpperCase()}
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
            {company.name} <span className="text-blue-600 block sm:inline">Rental Codes</span>
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto leading-relaxed">
            Verified corporate discount programs (CDP), promotion codes (PC), and AWDs for {company.name} employees and members.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-medium text-sm">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            {company.codes.length} Active Codes Available
          </div>
        </div>

        {/* 代码列表区域 */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Discount Codes</h2>

          {company.codes.length === 0 ? (
             <div className="bg-gray-50 rounded-2xl border border-dashed border-gray-300 p-12 text-center">
               <p className="text-gray-500">No active codes found for this organization at the moment.</p>
             </div>
          ) : (
            <div className="grid gap-4">
              {company.codes.map(code => (
                <div key={code.id} className="bg-white p-5 md:p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="bg-gray-900 text-white text-xs px-3 py-1.5 rounded-md font-bold uppercase tracking-wide">
                        {code.brand.name}
                      </span>
                      {code.codeType && (
                        <span className="text-xs font-semibold text-gray-500 border border-gray-200 px-2 py-1 rounded">
                          {code.codeType}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-700 leading-relaxed text-sm md:text-base">
                      {code.description || `Use this code to get corporate rates when renting with ${code.brand.name}.`}
                    </p>
                  </div>

                  <div className="flex flex-col items-center shrink-0">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Code</span>
                    <div className="bg-blue-50 border border-blue-100 text-blue-700 font-mono font-bold text-xl px-6 py-3 rounded-xl min-w-[160px] text-center select-all cursor-copy hover:bg-blue-100 transition-colors" title="Click to copy">
                      {code.codeValue}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 底部引导转化去 AI 生成页 */}
        <div className="bg-gradient-to-br from-gray-900 to-blue-900 rounded-3xl p-8 md:p-10 text-center shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white opacity-5 rounded-full blur-3xl"></div>
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-4 relative z-10">Need a detailed guide?</h3>
          <p className="text-blue-100 mb-8 max-w-xl mx-auto relative z-10 text-sm md:text-base">
            Are they strictly checking badges for {company.name} at the counter? Ask our AI expert for a personalized pitfall-avoidance guide based on real traveler data.
          </p>
          <Link href={`/ask?q=${encodeURIComponent(`${company.name} corporate code ID check`)}`} className="relative z-10 inline-block bg-blue-500 text-white font-bold px-8 py-4 rounded-xl shadow-lg hover:bg-blue-400 transition-colors hover:scale-105 active:scale-95">
            Ask AI Expert
          </Link>
        </div>
      </main>
    </div>
  );
}
