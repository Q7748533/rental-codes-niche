import { prisma } from '@/lib/db';
import Link from 'next/link';
import Script from 'next/script';
import AskAiWidget from '@/components/AskAiWidget';
import type { Metadata } from 'next';

// 强制动态渲染，避免构建时查询数据库
export const dynamic = 'force-dynamic';

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
  const brands = await prisma.brand.findMany({
    include: { _count: { select: { codes: true } } },
  });

  const companies = await prisma.company.findMany({
    select: { name: true, slug: true },
  });

  // 鑾峰彇鏈€鏂扮敓鎴愮殑 AI 鏂囩珷
  const latestArticles = await prisma.aiQuery.findMany({
    orderBy: { createdAt: 'desc' },
    take: 6,
    select: {
      slug: true,
      seoTitle: true,
      aiSummary: true,
      viewCount: true,
      createdAt: true,
    },
  });

  // 鑾峰彇鍏紑浼樻儬閾炬帴锛堢鐞嗗憳鍙紪杈戯級
  const publicDeals = await prisma.publicDeal.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });

  const totalCodes = brands.reduce((sum, b) => sum + b._count.codes, 0);

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
          url: 'https://carcorporatecodes.com/logo.png',
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
        about: {
          '@id': 'https://carcorporatecodes.com/#organization',
        },
        dateModified: new Date().toISOString(),
      },
      // ItemList - 鍝佺墝鍒楄〃
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
        ],
      },
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
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-xl md:text-2xl font-bold text-blue-700">Car Corporate Codes</div>
          <nav className="flex items-center space-x-3 md:space-x-6 text-xs md:text-sm font-medium text-gray-600">
            <Link href="#brands" className="hover:text-blue-600">Brands</Link>
            <Link href="#guide" className="hover:text-blue-600 hidden sm:inline">How to Use</Link>
            <Link href="#faq" className="hover:text-blue-600">FAQ</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-16">
        {/* H1: 绮惧噯澹版槑鏍稿績瀹炰綋 */}
        <div className="text-center mb-20 mt-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Car Rental Corporate Codes 2026
          </h1>
          <p className="text-xl text-gray-600 mb-4 max-w-3xl mx-auto">
            Verified CDP and PC codes for Hertz, Enterprise, Avis, Budget, and National. 
            Save 10-25% on business and leisure car rentals.
          </p>
          <p className="text-sm text-gray-500 mb-10">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} | 
            Database: {brands.reduce((sum, b) => sum + b._count.codes, 0)} active codes
          </p>

          {/* 鍏ㄦ柊鐨?AI 鑱婂ぉ妗嗙粍浠?*/}
          <div className="max-w-3xl mx-auto relative px-4 sm:px-0 z-10">
            <AskAiWidget companies={companies} />
          </div>
        </div>

        {/* H2: 鍝佺墝鍒楄〃 - 姣忎釜H2鐙珛鍙洖绛旂敤鎴锋悳绱㈡剰鍥?*/}
        <section id="brands" className="mb-24">
          <h2 className="text-2xl font-bold mb-2 text-gray-900">Browse Codes by Rental Brand</h2>
          <p className="text-gray-600 mb-6">Click any brand to view all available corporate and association discount codes.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {brands.length > 0 ? (
              brands.map((brand) => (
                <Link 
                  key={brand.id} 
                  href={`/${brand.slug}`}
                  className="block bg-white p-5 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all text-center"
                >
                  <h3 className="text-sm font-semibold text-gray-800 mb-1 capitalize">{brand.name}</h3>
                  <p className="text-xs text-gray-400">{brand._count.codes} codes</p>
                </Link>
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-gray-400 bg-white rounded-lg border border-dashed border-gray-300">
                No brands found. Add codes via admin panel.
              </div>
            )}
          </div>
        </section>

        {/* H2: 浣跨敤鎸囧崡 */}
        <section id="guide" className="mb-24">
          <h2 className="text-2xl font-bold mb-6 text-gray-900 border-b border-gray-200 pb-3">How to Use Car Rental Corporate Codes</h2>
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

        {/* H2: 椋庨櫓鎻愮ず */}
        <section id="risks" className="mb-24">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">Corporate Code Risks & Eligibility</h2>
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

        {/* H2: 鍏紑浼樻儬 */}
        <section className="mb-24">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">No Corporate Code? Use These Public Deals</h2>
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
                      rel="noopener noreferrer"
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
                  rel="noopener noreferrer"
                  className="w-full md:w-auto bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-xl font-bold shadow-md transition-transform hover:scale-105 active:scale-95 text-center"
                >
                  Compare Prices
                </a>
              </div>
            )}
          </div>
        </section>

        {/* H2: FAQ */}
        <section id="faq" className="mb-24">
          <h2 className="text-2xl font-bold mb-6 text-gray-900 border-b border-gray-200 pb-3">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <details className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <summary className="font-semibold text-gray-900 cursor-pointer">What is a CDP code?</summary>
              <p className="mt-3 text-gray-600 text-sm">CDP (Corporate Discount Program) is a negotiated rate between a rental company and an organization. It typically offers 10-25% off standard rates.</p>
            </details>
            <details className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <summary className="font-semibold text-gray-900 cursor-pointer">Can anyone use corporate codes?</summary>
              <p className="mt-3 text-gray-600 text-sm">No. Corporate codes are intended for employees or members of specific organizations. Rental agents may ask for proof of eligibility at pickup.</p>
            </details>
            <details className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <summary className="font-semibold text-gray-900 cursor-pointer">What happens if I use a code without eligibility?</summary>
              <p className="mt-3 text-gray-600 text-sm">The rental company may charge you the standard rate instead of the corporate rate. In some cases, they may refuse service or void insurance coverage.</p>
            </details>
          </div>
        </section>

        {/* H2: 鏈€鏂扮敓鎴愮殑鏂囩珷 */}
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

      {/* 椤佃剼 */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="text-white text-lg font-bold mb-4">Car Corporate Codes</h3>
              <p className="text-sm text-gray-400">
                Database of car rental corporate codes and discounts. Updated regularly for accuracy.
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
          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-500">
            <p>&copy; {new Date().getFullYear()} Car Corporate Codes. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
