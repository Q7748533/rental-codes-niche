import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import type { Metadata } from 'next';

// 强制动态渲染，避免构建时查询数据库
export const dynamic = 'force-dynamic';

// 动态生成 SEO 元数据
export async function generateMetadata({ params }: { params: Promise<{ brand: string }> }): Promise<Metadata> {
  const { brand: slug } = await params;
  const brand = await prisma.brand.findUnique({ where: { slug } });

  if (!brand) {
    return { title: 'Brand Not Found' };
  }

  const title = `${brand.name} Corporate Codes 2026 | CDP & PC Discount Numbers`;
  const description = `Verified ${brand.name} corporate discount codes (CDP/PC) for employees and members. Save 10-25% on car rentals. Updated ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}.`;
  const canonicalUrl = `https://carcorporatecodes.com/${brand.slug}`;

  return {
    title,
    description,
    keywords: [`${brand.name.toLowerCase()} corporate code`, `${brand.name.toLowerCase()} cdp code`, `${brand.name.toLowerCase()} discount`, 'car rental corporate codes'],
    openGraph: {
      title,
      description,
      type: 'website',
      url: canonicalUrl,
      siteName: 'Car Corporate Codes',
      images: [
        {
          url: 'https://carcorporatecodes.com/og-image.jpg',
          width: 1200,
          height: 630,
          alt: `${brand.name} Corporate Codes - Car Corporate Codes`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['https://carcorporatecodes.com/og-image.jpg'],
    },
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export default async function BrandPage({ params }: { params: Promise<{ brand: string }> }) {
  const { brand: currentBrandSlug } = await params;

  const brandData = await prisma.brand.findUnique({
    where: { slug: currentBrandSlug },
    include: {
      codes: {
        include: { company: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!brandData) {
    notFound();
  }

  // 获取其他品牌用于交叉推荐
  const otherBrands = await prisma.brand.findMany({
    where: { NOT: { id: brandData.id } },
    take: 3,
    include: { _count: { select: { codes: true } } },
  });

  // JSON-LD 结构化数据
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      // WebPage
      {
        '@type': 'WebPage',
        '@id': `https://carcorporatecodes.com/${brandData.slug}#webpage`,
        url: `https://carcorporatecodes.com/${brandData.slug}`,
        name: `${brandData.name} Corporate Codes 2026 | CDP & PC Discount Numbers`,
        description: `Verified ${brandData.name} corporate discount codes (CDP/PC) for employees and members. Save 10-25% on car rentals.`,
        isPartOf: {
          '@id': 'https://carcorporatecodes.com/#website',
        },
        breadcrumb: {
          '@id': `https://carcorporatecodes.com/${brandData.slug}#breadcrumb`,
        },
        dateModified: new Date().toISOString(),
      },
      // BreadcrumbList
      {
        '@type': 'BreadcrumbList',
        '@id': `https://carcorporatecodes.com/${brandData.slug}#breadcrumb`,
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: 'https://carcorporatecodes.com',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: `${brandData.name} Corporate Codes`,
            item: `https://carcorporatecodes.com/${brandData.slug}`,
          },
        ],
      },
      // ItemList - 折扣代码列表
      {
        '@type': 'ItemList',
        '@id': `https://carcorporatecodes.com/${brandData.slug}#codes-list`,
        itemListElement: brandData.codes.map((code, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: `${code.company.name} - ${brandData.name} Corporate Code`,
          description: code.description || `Corporate discount code for ${code.company.name}`,
          identifier: code.codeValue,
        })),
      },
      // Offer - 折扣信息
      ...(brandData.codes.length > 0
        ? brandData.codes.slice(0, 5).map((code) => ({
            '@type': 'Offer',
            name: `${brandData.name} Corporate Discount`,
            description: code.description || `Corporate rate for ${code.company.name}`,
            offeredBy: {
              '@type': 'Organization',
              name: brandData.name,
            },
            eligibleCustomerType: code.company.name,
            validFrom: code.createdAt.toISOString(),
          }))
        : []),
    ],
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* JSON-LD 结构化数据 */}
      <Script
        id="json-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* 面包屑导航 */}
      <nav className="bg-white border-b border-gray-200" aria-label="Breadcrumb">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <ol className="flex items-center space-x-2 text-sm text-gray-500">
            <li><Link href="/" className="hover:text-blue-600">Home</Link></li>
            <li>/</li>
            <li className="text-gray-900 font-medium capitalize">{brandData.name} Codes</li>
          </ol>
        </div>
      </nav>

      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-xl md:text-2xl font-bold text-blue-700 hover:opacity-80">
            Car Corporate Codes
          </Link>
          <Link href="/" className="text-xs md:text-sm font-medium text-gray-500 hover:text-gray-900">
            &larr; Back
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* H1: 精准包含品牌名和核心关键词 */}
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 capitalize">
            {brandData.name} Corporate Codes & CDP Numbers 2026
          </h1>
          <p className="text-lg text-gray-600">
            Complete list of verified {brandData.name} corporate discount program (CDP) codes and promotion codes. 
            {brandData.codes.length > 0 ? ` ${brandData.codes.length} active codes available.` : ' No codes currently available.'}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Last verified: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        {/* 风险提示 */}
        <section className="mb-10">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <h2 className="font-bold text-yellow-900 mb-2">Eligibility Required</h2>
            <p className="text-yellow-800 text-sm">
              These codes are for eligible employees and members only. {brandData.name} may require 
              proof of employment or membership at the rental counter.
            </p>
          </div>
        </section>

        {/* 代码列表 */}
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-4 text-gray-900">Available {brandData.name} Discount Codes</h2>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            
            {/* ========================================== */}
            {/* 1. 桌面端高阶 5 列宽屏表格 */}
            {/* ========================================== */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-xs uppercase tracking-wider">
                    <th className="p-5 font-bold w-1/5">Organization</th>
                    <th className="p-5 font-bold w-1/6">Source</th>
                    <th className="p-5 font-bold w-1/6">Business Code</th>
                    <th className="p-5 font-bold w-1/6">Leisure Code</th>
                    <th className="p-5 font-bold w-auto">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {brandData.codes.map((codeItem: any) => (
                    <tr key={codeItem.id} className="hover:bg-blue-50 transition-colors">
                      {/* 公司名 */}
                      <td className="p-5">
                        <div className="font-bold text-gray-900 text-base capitalize">{codeItem.company.name}</div>
                      </td>
                      {/* 来源标签 */}
                      <td className="p-5">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {codeItem.source || 'Employee'}
                        </span>
                      </td>
                      {/* 商务码 (Business) */}
                      <td className="p-5">
                        {(!codeItem.codeType || codeItem.codeType.toLowerCase() === 'business') ? (
                          <code className="inline-block bg-blue-100 text-blue-800 font-mono font-bold px-3 py-1.5 rounded border border-blue-200 tracking-widest text-sm">
                            {codeItem.codeValue}
                          </code>
                        ) : (
                          <span className="text-gray-400 text-sm italic">N/A</span>
                        )}
                      </td>
                      {/* 休闲码 (Leisure) */}
                      <td className="p-5">
                        {codeItem.codeType?.toLowerCase() === 'leisure' ? (
                          <code className="inline-block bg-green-100 text-green-800 font-mono font-bold px-3 py-1.5 rounded border border-green-200 tracking-widest text-sm">
                            {codeItem.codeValue}
                          </code>
                        ) : (
                          <span className="text-gray-400 text-sm italic">N/A</span>
                        )}
                      </td>
                      
                      {/* 🚀 视觉升级：描述与警告的极致对比 */}
                      <td className="p-5 text-gray-600 text-sm leading-relaxed">
                        {(!codeItem.codeType || codeItem.codeType.toLowerCase() === 'business') && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-600 uppercase tracking-wider mr-2 border border-red-200">
                            🚨 ID Required
                          </span>
                        )}
                        {codeItem.codeType?.toLowerCase() === 'leisure' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-green-50 text-green-600 uppercase tracking-wider mr-2 border border-green-200">
                            ✅ Safe to Use
                          </span>
                        )}
                        {codeItem.description || 'Standard rates apply.'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ========================================== */}
            {/* 2. 移动端高转化率卡片布局 */}
            {/* ========================================== */}
            <div className="sm:hidden divide-y divide-gray-100">
              {brandData.codes.map((codeItem: any) => (
                <div key={codeItem.id} className="p-5 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div className="font-bold text-gray-900 text-lg capitalize">{codeItem.company.name}</div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 uppercase tracking-wider border border-gray-200">
                      {codeItem.source || 'Employee'}
                    </span>
                  </div>
                  
                  <div className="flex flex-col space-y-2 mb-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    {/* 手机端商务码展示 */}
                    {(!codeItem.codeType || codeItem.codeType.toLowerCase() === 'business') && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 font-bold uppercase tracking-wide">Business:</span>
                        <code className="inline-block bg-blue-100 text-blue-800 font-mono font-bold px-3 py-1 rounded border border-blue-200 tracking-widest text-sm">
                          {codeItem.codeValue}
                        </code>
                      </div>
                    )}
                    {/* 手机端休闲码展示 */}
                    {codeItem.codeType?.toLowerCase() === 'leisure' && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 font-bold uppercase tracking-wide">Leisure:</span>
                        <code className="inline-block bg-green-100 text-green-800 font-mono font-bold px-3 py-1 rounded border border-green-200 tracking-widest text-sm">
                          {codeItem.codeValue}
                        </code>
                      </div>
                    )}
                  </div>

                  {/* 🚀 视觉升级：手机端的极致对比 */}
                  <div className="text-gray-600 text-sm leading-relaxed mt-2">
                    <div className="mb-2">
                      {(!codeItem.codeType || codeItem.codeType.toLowerCase() === 'business') && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-600 uppercase tracking-wider mr-2 border border-red-200">
                          🚨 ID Required
                        </span>
                      )}
                      {codeItem.codeType?.toLowerCase() === 'leisure' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-green-50 text-green-600 uppercase tracking-wider mr-2 border border-green-200">
                          ✅ Safe to Use
                        </span>
                      )}
                    </div>
                    {codeItem.description || 'Standard rates apply.'}
                  </div>
                </div>
              ))}
            </div>

            {brandData.codes.length === 0 && (
              <div className="p-10 text-center text-gray-500">
                <p>No codes available for {brandData.name} at this time.</p>
                <p className="text-sm mt-2">Check back later or browse other brands below.</p>
              </div>
            )}
          </div>
        </section>

        {/* 如何使用 */}
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-4 text-gray-900">How to Use {brandData.name} Corporate Codes</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <ol className="list-decimal list-inside space-y-3 text-gray-700">
              <li>Visit <strong>{brandData.name}.com</strong> or use their mobile app</li>
              <li>Enter your pickup location and dates</li>
              <li>Look for "Corporate Account" or "CDP" field</li>
              <li>Enter the code from the table above</li>
              <li>Compare rates and complete your booking</li>
              <li>Bring proof of eligibility when picking up the vehicle</li>
            </ol>
          </div>
        </section>

        {/* 替代方案 */}
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-4 text-gray-900">No Eligibility? Try These Public Deals</h2>
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
            <p className="text-blue-800 mb-4">Compare {brandData.name} rates with no corporate code required.</p>
            <a
              href={`https://www.discovercars.com/?brand=${brandData.name.toLowerCase()}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-bold shadow transition-colors"
            >
              Compare {brandData.name} Prices
            </a>
          </div>
        </section>

        {/* 其他品牌推荐 */}
        {otherBrands.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Other Rental Brands</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {otherBrands.map((brand) => (
                <Link key={brand.id} href={`/${brand.slug}`}>
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all">
                    <h3 className="font-bold text-gray-900 capitalize">{brand.name}</h3>
                    <p className="text-sm text-gray-500">{brand._count.codes} codes</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* 页脚 */}
      <footer className="bg-gray-900 text-gray-300 py-8 mt-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} Car Corporate Codes. Corporate codes require eligibility verification.
          </p>
        </div>
      </footer>
    </div>
  );
}