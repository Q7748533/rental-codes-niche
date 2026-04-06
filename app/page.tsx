import { prisma } from '@/lib/db';
import Link from 'next/link';
import Script from 'next/script';
// 🚀 优化：MobileNav 懒加载，减少首屏JS
import dynamic from 'next/dynamic';
import { unstable_cache } from 'next/cache';
import type { Metadata } from 'next';

// 🚀 优化：懒加载非关键组件
import MobileNavClient from '@/components/MobileNavClient';

const AskAiWidgetLazy = dynamic(() => import('@/components/AskAiWidgetLazy'), {
  ssr: true,
  loading: () => (
    <div className="w-full h-[60px] md:h-[68px] bg-gray-100 animate-pulse rounded-xl border border-gray-200"></div>
  ),
});

// 强制动态渲染，避免构建时查询数据库
export const revalidate = 3600;

// 缓存 brands 查询（1小时）
const getCachedBrands = unstable_cache(
  async () => {
    return prisma.brand.findMany({
      include: { _count: { select: { codes: true } } },
    });
  },
  ['brands-list'],
  { revalidate: 3600, tags: ['brands'] }
);

// 缓存 companies 查询（1小时）
const getCachedCompanies = unstable_cache(
  async () => {
    return prisma.company.findMany({
      select: { name: true, slug: true },
    });
  },
  ['companies-list'],
  { revalidate: 3600, tags: ['companies'] }
);

export const metadata: Metadata = {
  title: 'Car Rental Corporate Codes 2026 | Hertz, Enterprise, Avis Discounts',
  description: 'Verified car rental corporate codes for Hertz, Enterprise, Avis, Budget. Save 10-25% on business travel with CDP and PC codes. Updated daily.',
  keywords: ['car rental corporate codes', 'hertz cdp codes', 'enterprise discount codes', 'avis corporate codes', 'rental car discounts'],
  openGraph: {
    title: 'Car Rental Corporate Codes 2026 | Hertz, Enterprise, Avis Discounts',
    description: 'Verified car rental corporate codes for Hertz, Enterprise, Avis, Budget. Save 10-25% on business travel.',
    type: 'website',
    url: 'https://carcorporatecodes.com',
    siteName: 'Car Corporate Codes',
    images: [
      {
        url: 'https://carcorporatecodes.com/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Car Corporate Codes - Car Rental Corporate Codes',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Car Rental Corporate Codes 2026 | Hertz, Enterprise, Avis Discounts',
    description: 'Verified car rental corporate codes. Save 10-25% on business travel.',
    images: ['https://carcorporatecodes.com/og-image.jpg'],
  },
  alternates: {
    canonical: 'https://carcorporatecodes.com',
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

export default async function Home() {
  // 并发获取所有数据，减少网络往返时间
  const [brands, companies, latestArticles, publicDeals, latestCodeRecord] = await Promise.all([
    // 使用缓存查询 brands
    getCachedBrands(),
    // 使用缓存查询 companies
    getCachedCompanies(),
    // 获取最新生成的 AI 文章
    prisma.aiQuery.findMany({
      orderBy: { createdAt: 'desc' },
      take: 6,
      select: {
        slug: true,
        seoTitle: true,
        aiSummary: true,
        viewCount: true,
        createdAt: true,
      },
    }),
    // 获取公开优惠链接（管理员可编辑）
    prisma.publicDeal.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    }),
    // 获取最新更新的代码时间
    prisma.code.findFirst({
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true },
    }),
  ]);

  const totalCodes = brands.reduce((sum, b) => sum + b._count.codes, 0);

  // 计算真正的全局最后修改时间（取文章和代码中最新的那个）
  const latestArticleDate = latestArticles.length > 0 ? latestArticles[0].createdAt.getTime() : 0;
  const latestCodeDate = latestCodeRecord ? latestCodeRecord.updatedAt.getTime() : 0;
  const realLastModified = new Date(Math.max(latestArticleDate, latestCodeDate));
  const isoDateModified = realLastModified.toISOString();
  const displayDateModified = realLastModified.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // JSON-LD 结构化数据
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      // Organization
      {
        '@type': 'Organization',
        '@id': 'https://carcorporatecodes.com/#organization',
        name: 'Car Corporate Codes',
        url: 'https://carcorporatecodes.com',
        logo: {
          '@type': 'ImageObject',
          url: 'https://carcorporatecodes.com/og-image.svg',
        },
        description: 'Database of verified car rental corporate codes and discounts',
      },
      // WebSite
      {
        '@type': 'WebSite',
        '@id': 'https://carcorporatecodes.com/#website',
        url: 'https://carcorporatecodes.com',
        name: 'Car Corporate Codes - Car Rental Corporate Codes',
        publisher: {
          '@id': 'https://carcorporatecodes.com/#organization',
        },
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: 'https://carcorporatecodes.com/search?q={search_term_string}',
          },
          'query-input': 'required name=search_term_string',
        },
      },
      // BreadcrumbList
      {
        '@type': 'BreadcrumbList',
        '@id': 'https://carcorporatecodes.com/#breadcrumb',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: 'https://carcorporatecodes.com',
          },
        ],
      },
      // WebPage
      {
        '@type': 'WebPage',
        '@id': 'https://carcorporatecodes.com/#webpage',
        url: 'https://carcorporatecodes.com',
        name: 'Car Rental Corporate Codes 2026 | Hertz, Enterprise, Avis Discounts',
        description: `Verified CDP and PC codes for Hertz, Enterprise, Avis, Budget, and National. Database of ${totalCodes} active codes.`,
        isPartOf: {
          '@id': 'https://carcorporatecodes.com/#website',
        },
        breadcrumb: {
          '@id': 'https://carcorporatecodes.com/#breadcrumb',
        },
        about: {
          '@id': 'https://carcorporatecodes.com/#organization',
        },
        dateModified: isoDateModified,
      },
      // ItemList - 品牌列表
      {
        '@type': 'ItemList',
        '@id': 'https://carcorporatecodes.com/#brands-list',
        itemListElement: brands.map((brand, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: `${brand.name} Corporate Codes`,
          url: `https://carcorporatecodes.com/${brand.slug}`,
          description: `${brand._count.codes} active discount codes for ${brand.name}`,
        })),
      },
      // FAQPage
      {
        '@type': 'FAQPage',
        '@id': 'https://carcorporatecodes.com/#faq',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'What is a CDP code?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'CDP (Corporate Discount Program) is a negotiated rate between a rental company and an organization. It typically offers 10-25% off standard rates.',
            },
          },
          {
            '@type': 'Question',
            name: 'Can anyone use corporate codes?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'No. Corporate codes are intended for employees or members of specific organizations. Rental agents may ask for proof of eligibility at pickup.',
            },
          },
          {
            '@type': 'Question',
            name: 'What happens if I use a code without eligibility?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'The rental company may charge you the standard rate instead of the corporate rate. In some cases, they may refuse service or void insurance coverage.',
            },
          },
          {
            '@type': 'Question',
            name: 'How often is your database updated?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Our database is updated monthly by crawling publicly available sources. However, we recommend verifying all codes directly with the rental company before booking.',
            },
          },
          {
            '@type': 'Question',
            name: 'Are these codes verified to work?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'We collect codes from public sources but do not individually verify each code. Codes may expire or change without notice. Always confirm eligibility and validity at checkout.',
            },
          },
        ],
      },
      // ItemList - 最新文章列表（SEO 权重提升）
      ...(latestArticles.length > 0 ? [{
        '@type': 'ItemList',
        '@id': 'https://carcorporatecodes.com/#latest-articles',
        name: 'Latest Car Rental Corporate Code Guides',
        itemListElement: latestArticles.map((article, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: article.seoTitle,
          url: `https://carcorporatecodes.com/ask/${article.slug}`,
          description: article.aiSummary?.substring(0, 160) || '',
        })),
      }] : []),
    ],
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* JSON-LD 缁撴瀯鍖栨暟鎹?*/}
      <Script
        id="json-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* 🚀 终极优化 2：毛玻璃吸顶导航，移动端压缩高度 */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/80 shadow-sm transition-all" role="banner" aria-label="Site header">
        <div className="max-w-6xl mx-auto px-4 py-3 md:py-4 flex justify-between items-center">
          <Link href="/" className="text-xl md:text-2xl font-bold text-blue-700" aria-label="Car Corporate Codes - Home">Car Corporate Codes</Link>
          <div className="flex items-center">
            <nav className="hidden md:flex items-center space-x-6 text-sm font-medium text-gray-600" aria-label="Main navigation">
              <Link href="#brands" className="hover:text-blue-600 min-h-[44px] flex items-center px-2">Brands</Link>
              <Link href="#guide" className="hover:text-blue-600 min-h-[44px] flex items-center px-2">How to Use</Link>
              <Link href="#faq" className="hover:text-blue-600 min-h-[44px] flex items-center px-2">FAQ</Link>
              <Link href="/ask" className="hover:text-blue-600 min-h-[44px] flex items-center px-2">Ask AI</Link>
            </nav>
            <MobileNavClient />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12 md:py-16" role="main" aria-label="Main content">
        <div className="text-center mb-20 mt-4 md:mt-8">
          {/* 🚀 终极优化 3：移动端收缩字体，留出首屏空间 */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 md:mb-6 leading-tight tracking-tight">
            Car Rental Corporate Codes 2026:<br className="hidden md:block" />
            <span className="text-blue-700">Hertz, Enterprise, Avis CDP Discounts</span>
          </h1>

          {/* 🚀 终极优化 4：修复错位徽章，使用 flex 居中排列 */}
          <div className="mb-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <span className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-md">
              <span className="w-2 h-2 bg-emerald-200 rounded-full animate-pulse"></span>
              Database Updated: {displayDateModified}
            </span>
            <span className="text-sm text-gray-500 font-medium">
              {totalCodes} codes collected from public sources
            </span>
          </div>

          {/* 🚀 终极优化 5：AI 搜索框置顶！去除多余边距让移动端更宽 */}
          <div className="max-w-3xl mx-auto relative z-10 mb-6 sm:px-4">
            <AskAiWidgetLazy companies={companies} />
          </div>

          {/* 🚀 终极优化 6：免责声明下移并弱化，不再喧宾夺主 */}
          <div className="max-w-2xl mx-auto text-center px-4">
            <p className="text-gray-400 text-xs leading-relaxed">
              <span className="font-semibold text-gray-500">Disclaimer:</span> Corporate codes are sourced from public data.
              Always verify eligibility at checkout. We are not affiliated with any rental companies.
            </p>
          </div>
        </div>

        {/* 🚀 终极优化 7：品牌列表拟物化设计，增强点击欲 */}
        <section id="brands" className="mb-24" aria-labelledby="brands-heading">
          <h2 id="brands-heading" className="text-2xl font-bold mb-2 text-gray-900">Rental Brands with Corporate Codes</h2>
          <p className="text-gray-600 mb-6">Click any brand to view all available corporate and association discount codes.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {brands.length > 0 ? (
              brands.map((brand) => (
                <Link
                  key={brand.id}
                  href={`/${brand.slug}`}
                  className="group block bg-white p-5 rounded-2xl border border-gray-100 hover:border-blue-500 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-center"
                >
                  <div className="w-12 h-12 mx-auto bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold text-xl mb-3 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    {brand.name.charAt(0).toUpperCase()}
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 mb-1 capitalize group-hover:text-blue-600 transition-colors">
                    {brand.name}
                  </h3>
                  <span className="inline-block bg-gray-50 text-gray-500 text-[11px] px-2 py-1 rounded-md font-medium">
                    {brand._count.codes} verified codes
                  </span>
                </Link>
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-gray-400 bg-white rounded-lg border border-dashed border-gray-300">
                No brands found.
              </div>
            )}
          </div>
        </section>

        {/* H2: 使用指南 */}
        <section id="guide" className="mb-24" aria-labelledby="guide-heading">
          <h2 id="guide-heading" className="text-2xl font-bold mb-6 text-gray-900 border-b border-gray-200 pb-3">How Corporate Codes Work</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-3">1. Find Your Code</h3>
              <p className="text-gray-600 text-sm">Search by company name or browse by rental brand. We list CDP (Corporate Discount Program) and PC (Promotion Code) numbers.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-3">2. Book Online</h3>
              <p className="text-gray-600 text-sm">Enter the code in the "Corporate Account" or "Discount Code" field during checkout. Compare rates before booking.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-3">3. Verify Eligibility</h3>
              <p className="text-gray-600 text-sm">Bring proof of employment or membership. Some codes require ID verification at the rental counter.</p>
            </div>
          </div>
        </section>

        {/* H2: 风险提示 */}
        <section id="risks" className="mb-24">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">Code Risks: ID Checks & Eligibility</h2>
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
            <p className="text-gray-800 mb-4">
              <strong>Important:</strong> Corporate rates are negotiated between rental companies and organizations. 
              Using a code without eligibility may result in:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 text-sm">
              <li>Rates being adjusted to standard pricing at pickup</li>
              <li>Requirement to show employee ID or membership proof</li>
              <li>Loss of insurance coverage in some cases</li>
            </ul>
            <p className="text-gray-600 mt-4 text-sm">
              Always verify your eligibility before using any corporate code. When in doubt, use publicly available discounts below.
            </p>
          </div>
        </section>

        {/* H2: 公开优惠 */}
        <section className="mb-24">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">Public Deals (No ID Required)</h2>
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-8 md:p-10 border border-blue-100 shadow-inner">
            <p className="text-blue-800 mb-8 text-lg">No ID required. No eligibility checks. Fully insured rentals.</p>
            {publicDeals.length > 0 ? (
              <div className="space-y-4">
                {publicDeals.map((deal) => (
                  <div key={deal.id} className="bg-white p-6 md:p-8 rounded-2xl shadow-sm flex flex-col md:flex-row items-center justify-between border border-white">
                    <div className="mb-6 md:mb-0 text-center md:text-left">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{deal.title}</h3>
                      <p className="text-gray-600">{deal.description}</p>
                    </div>
                    <a 
                      href={deal.linkUrl}
                      target="_blank" 
                      rel="nofollow sponsored noopener noreferrer"
                      className="w-full md:w-auto bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-xl font-bold shadow-md transition-transform hover:scale-105 active:scale-95 text-center"
                    >
                      {deal.buttonText}
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm flex flex-col md:flex-row items-center justify-between border border-white">
                <div className="mb-6 md:mb-0 text-center md:text-left">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Discover Cars Price Comparison</h3>
                  <p className="text-gray-600">Compare rates from 500+ rental companies. Best price guarantee. Free cancellation.</p>
                </div>
                <a 
                  href="https://www.discovercars.com" 
                  target="_blank" 
                  rel="nofollow sponsored noopener noreferrer"
                  className="w-full md:w-auto bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-xl font-bold shadow-md transition-transform hover:scale-105 active:scale-95 text-center"
                >
                  Compare Prices
                </a>
              </div>
            )}
          </div>
        </section>

        {/* H2: FAQ - 手风琴折叠效果 */}
        <section id="faq" className="mb-24" aria-labelledby="faq-heading">
          <h2 id="faq-heading" className="text-2xl font-bold mb-6 text-gray-900 border-b border-gray-200 pb-3">Frequently Asked Questions</h2>
          <div className="max-w-3xl mx-auto space-y-4">
            {/* FAQ 1 */}
            <details className="group bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex items-center justify-between p-5 font-semibold text-gray-900 cursor-pointer hover:bg-gray-50 transition-colors">
                What is a CDP code?
                <span className="transition duration-300 group-open:-rotate-180">
                  <svg fill="none" height="20" width="20" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"></path></svg>
                </span>
              </summary>
              <div className="p-5 pt-0 text-gray-600 text-sm leading-relaxed border-t border-gray-50 bg-gray-50/50">
                CDP (Corporate Discount Program) is a negotiated rate between a rental company and an organization. It typically offers 10-25% off standard rates.
              </div>
            </details>

            {/* FAQ 2 */}
            <details className="group bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex items-center justify-between p-5 font-semibold text-gray-900 cursor-pointer hover:bg-gray-50 transition-colors">
                Can anyone use corporate codes?
                <span className="transition duration-300 group-open:-rotate-180">
                  <svg fill="none" height="20" width="20" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"></path></svg>
                </span>
              </summary>
              <div className="p-5 pt-0 text-gray-600 text-sm leading-relaxed border-t border-gray-50 bg-gray-50/50">
                No. Corporate codes are intended for employees or members of specific organizations. Rental agents may ask for proof of eligibility at pickup.
              </div>
            </details>

            {/* FAQ 3 */}
            <details className="group bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex items-center justify-between p-5 font-semibold text-gray-900 cursor-pointer hover:bg-gray-50 transition-colors">
                What happens if I use a code without eligibility?
                <span className="transition duration-300 group-open:-rotate-180">
                  <svg fill="none" height="20" width="20" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"></path></svg>
                </span>
              </summary>
              <div className="p-5 pt-0 text-gray-600 text-sm leading-relaxed border-t border-gray-50 bg-gray-50/50">
                The rental company may charge you the standard rate instead of the corporate rate. In some cases, they may refuse service or void insurance coverage.
              </div>
            </details>

            {/* FAQ 4 */}
            <details className="group bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex items-center justify-between p-5 font-semibold text-gray-900 cursor-pointer hover:bg-gray-50 transition-colors">
                How often is your database updated?
                <span className="transition duration-300 group-open:-rotate-180">
                  <svg fill="none" height="20" width="20" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"></path></svg>
                </span>
              </summary>
              <div className="p-5 pt-0 text-gray-600 text-sm leading-relaxed border-t border-gray-50 bg-gray-50/50">
                Our database is updated monthly by crawling publicly available sources. However, we recommend verifying all codes directly with the rental company before booking.
              </div>
            </details>

            {/* FAQ 5 */}
            <details className="group bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex items-center justify-between p-5 font-semibold text-gray-900 cursor-pointer hover:bg-gray-50 transition-colors">
                Are these codes verified to work?
                <span className="transition duration-300 group-open:-rotate-180">
                  <svg fill="none" height="20" width="20" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"></path></svg>
                </span>
              </summary>
              <div className="p-5 pt-0 text-gray-600 text-sm leading-relaxed border-t border-gray-50 bg-gray-50/50">
                We collect codes from public sources but do not individually verify each code. Codes may expire or change without notice. Always confirm eligibility and validity at checkout.
              </div>
            </details>
          </div>
        </section>

        {/* H2: 最新生成的文章 */}
        {latestArticles.length > 0 && (
          <section id="latest-articles" className="mb-24">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Latest AI Rental Guides</h2>
              </div>
              <Link 
                href="/ask" 
                className="hidden sm:inline-flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                View All <span className="ml-1">&rarr;</span>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {latestArticles.map((article) => (
                <Link 
                  key={article.slug} 
                  href={`/ask/${article.slug}`}
                  className="block bg-white p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all"
                >
                  <h3 className="text-[15px] font-medium text-gray-800 mb-1.5 line-clamp-2 leading-snug">
                    {article.seoTitle}
                  </h3>
                  <p className="text-xs text-gray-400 tracking-wide">
                    {new Date(article.createdAt).toLocaleDateString('en-US', { 
                      year: 'numeric',
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </p>
                </Link>
              ))}
            </div>
            <div className="mt-6 text-center sm:hidden">
              <Link 
                href="/ask" 
                className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                View All Articles <span className="ml-1">&rarr;</span>
              </Link>
            </div>
          </section>
        )}
      </main>

      {/* 页脚 */}
      <footer className="bg-gray-900 text-gray-300 py-12" role="contentinfo" aria-label="Site footer">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="text-white text-lg font-bold mb-4">Car Corporate Codes</h3>
              <p className="text-sm text-gray-400">
                Database of car rental corporate codes collected from public sources. 
                Not affiliated with any rental companies.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
                <li><Link href="#brands" className="hover:text-white transition-colors">All Brands</Link></li>
                <li><Link href="/tips" className="hover:text-white transition-colors">Tips & Guides</Link></li>
                <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          
          {/* 页脚免责声明 */}
          <div className="border-t border-gray-800 pt-6 mb-6">
            <p className="text-xs text-gray-500 leading-relaxed">
              <strong>Important Notice:</strong> All corporate codes are sourced from publicly available information. 
              We do not guarantee the validity or eligibility requirements of any code. 
              Rental companies may change codes, rates, or eligibility criteria at any time. 
              Always verify discounts directly with the rental company before booking. 
              Use of corporate codes without proper eligibility may result in rate adjustments or service refusal.
            </p>
          </div>
          
          <div className="border-t border-gray-800 pt-6 text-center text-sm text-gray-500">
            <p>&copy; {new Date().getFullYear()} Car Corporate Codes. All rights reserved. | Data last updated: {realLastModified.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
