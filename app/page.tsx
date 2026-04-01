import Link from 'next/link';
import Script from 'next/script';
import AskAiWidget from '@/components/AskAiWidget';
import type { Metadata } from 'next';

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

// 静态品牌数据（构建时使用）
const staticBrands = [
  { id: '1', name: 'Hertz', slug: 'hertz', codeCount: 12 },
  { id: '2', name: 'Enterprise', slug: 'enterprise', codeCount: 8 },
  { id: '3', name: 'Avis', slug: 'avis', codeCount: 10 },
  { id: '4', name: 'Budget', slug: 'budget', codeCount: 6 },
  { id: '5', name: 'National', slug: 'national', codeCount: 5 },
  { id: '6', name: 'Alamo', slug: 'alamo', codeCount: 4 },
  { id: '7', name: 'Dollar', slug: 'dollar', codeCount: 3 },
  { id: '8', name: 'Thrifty', slug: 'thrifty', codeCount: 3 },
];

const staticCompanies = [
  { name: 'IBM', slug: 'ibm' },
  { name: 'Microsoft', slug: 'microsoft' },
  { name: 'Amazon', slug: 'amazon' },
  { name: 'Google', slug: 'google' },
  { name: 'Apple', slug: 'apple' },
  { name: 'Meta', slug: 'meta' },
];

const staticArticles = [
  {
    slug: 'hertz-corporate-discount-codes-2024-save-up-to-40-off-your-r-5849.html',
    seoTitle: 'Hertz Corporate Discount Codes 2024: Save Up to 40% Off Your Rental',
    aiSummary: 'Discover the best Hertz corporate discount codes for 2024. IBM employees can save up to 40% with CDP codes. Learn eligibility requirements and booking tips.',
    viewCount: 1250,
    createdAt: new Date('2024-03-15'),
  },
  {
    slug: 'enterprise-corporate-discount-codes-2025-save-up-to-25-aaa-a-2036.html',
    seoTitle: 'Enterprise Corporate Discount Codes 2025: Save Up to 25% (AAA & More)',
    aiSummary: 'Enterprise corporate codes offer savings up to 25% for employees and association members. Find valid CDP codes and learn how to apply them.',
    viewCount: 980,
    createdAt: new Date('2024-03-10'),
  },
  {
    slug: 'avis-corporate-codes-2025-save-up-to-30-on-los-angeles-renta-4468.html',
    seoTitle: 'Avis Corporate Codes 2025: Save Up to 30% on Los Angeles Rentals',
    aiSummary: 'Avis corporate discount codes can save you up to 30% on car rentals. Check eligibility requirements and find the best codes for your needs.',
    viewCount: 850,
    createdAt: new Date('2024-03-05'),
  },
];

const staticDeals = [
  { id: '1', title: 'Hertz Weekend Special', description: 'Save 15% on weekend rentals', url: 'https://hertz.com', discount: '15% OFF', isActive: true },
  { id: '2', title: 'Enterprise Business Rate', description: 'Corporate rates for small businesses', url: 'https://enterprise.com', discount: '20% OFF', isActive: true },
  { id: '3', title: 'Avis Preferred Plus', description: 'Free upgrade on compact rentals', url: 'https://avis.com', discount: 'FREE UPGRADE', isActive: true },
];

export default function Home() {
  const brands = staticBrands;
  const companies = staticCompanies;
  const latestArticles = staticArticles;
  const publicDeals = staticDeals;
  const totalCodes = 51;

  // JSON-LD 结构化数据
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
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
      {
        '@type': 'WebSite',
        '@id': 'https://carcorporatecodes.com/#website',
        url: 'https://carcorporatecodes.com',
        name: 'Car Corporate Codes - Car Rental Corporate Codes',
        publisher: {
          '@id': 'https://carcorporatecodes.com/#organization',
        },
      },
      {
        '@type': 'WebPage',
        '@id': 'https://carcorporatecodes.com/#webpage',
        url: 'https://carcorporatecodes.com',
        name: 'Car Rental Corporate Codes 2026 | Hertz, Enterprise, Avis Discounts',
        isPartOf: {
          '@id': 'https://carcorporatecodes.com/#website',
        },
        about: {
          '@id': 'https://carcorporatecodes.com/#organization',
        },
        description: 'Verified car rental corporate codes for Hertz, Enterprise, Avis, Budget. Save 10-25% on business travel.',
      },
    ],
  };

  return (
    <>
      <Script
        id="json-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* H1: 主标题 - 精准声明核心实体 */}
          <section className="mb-16">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
              Car Rental Corporate Codes 2026
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mb-6">
              Verified CDP and PC discount codes for Hertz, Enterprise, Avis, Budget, and National. 
              Save 10-25% on business and leisure car rentals with corporate rates.
            </p>
            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              <span className="bg-white px-3 py-1 rounded-full border border-gray-200">
                {brands.length} Rental Brands
              </span>
              <span className="bg-white px-3 py-1 rounded-full border border-gray-200">
                {totalCodes}+ Corporate Codes
              </span>
              <span className="bg-white px-3 py-1 rounded-full border border-gray-200">
                Updated March 2026
              </span>
            </div>
          </section>

          {/* AI Widget */}
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 sm:p-8 mb-16 text-white shadow-xl">
            <div className="max-w-3xl mx-auto relative px-4 sm:px-0 z-10">
              <AskAiWidget companies={companies} />
            </div>
          </div>

          {/* H2: 品牌列表 */}
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
                    <p className="text-xs text-gray-400">{brand.codeCount} codes</p>
                  </Link>
                ))
              ) : (
                <div className="col-span-full text-center py-12 text-gray-400 bg-white rounded-lg border border-dashed border-gray-300">
                  No brands found. Add codes via admin panel.
                </div>
              )}
            </div>
          </section>

          {/* H2: 使用指南 */}
          <section className="mb-24 bg-white rounded-xl p-6 sm:p-8 border border-gray-200">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">How to Use Corporate Codes</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">1</div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Find Your Code</h3>
                  <p className="text-sm text-gray-600">Search by rental brand or your employer/association to find eligible CDP or PC codes.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">2</div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Verify Eligibility</h3>
                  <p className="text-sm text-gray-600">Corporate codes require proof of employment or membership. Have your ID ready at pickup.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">3</div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Book & Save</h3>
                  <p className="text-sm text-gray-600">Enter the code when booking online or mention it when calling. Save 10-25% instantly.</p>
                </div>
              </div>
            </div>
          </section>

          {/* H2: 公开优惠链接 */}
          {publicDeals.length > 0 && (
            <section className="mb-24">
              <h2 className="text-2xl font-bold mb-2 text-gray-900">Current Promotions</h2>
              <p className="text-gray-600 mb-6">Limited-time offers and public corporate rate promotions.</p>
              <div className="grid md:grid-cols-3 gap-4">
                {publicDeals.map((deal) => (
                  <a 
                    key={deal.id}
                    href={deal.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-white p-5 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{deal.title}</h3>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-medium">
                        {deal.discount}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{deal.description}</p>
                  </a>
                ))}
              </div>
            </section>
          )}

          {/* H2: 最新文章 */}
          {latestArticles.length > 0 && (
            <section className="mb-24">
              <h2 className="text-2xl font-bold mb-2 text-gray-900">Latest Corporate Code Guides</h2>
              <p className="text-gray-600 mb-6">Detailed breakdowns of the best corporate discount codes by brand and eligibility.</p>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {latestArticles.map((article) => (
                  <article key={article.slug} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                    <Link href={`/ask/${article.slug}`} className="block p-5">
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{article.seoTitle}</h3>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-3">{article.aiSummary}</p>
                      <div className="flex items-center text-xs text-gray-400">
                        <span>{new Date(article.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                      </div>
                    </Link>
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* H2: FAQ */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Frequently Asked Questions</h2>
            <div className="space-y-4">
              <details className="bg-white rounded-lg border border-gray-200 group">
                <summary className="flex justify-between items-center p-4 cursor-pointer font-medium text-gray-900">
                  What is a CDP code?
                  <span className="transition-transform group-open:rotate-180">▼</span>
                </summary>
                <div className="px-4 pb-4 text-gray-600">
                  CDP (Corporate Discount Program) codes are unique identifiers that rental companies use to offer negotiated rates to corporate employees and association members. These codes can save you 10-25% off standard rates.
                </div>
              </details>
              <details className="bg-white rounded-lg border border-gray-200 group">
                <summary className="flex justify-between items-center p-4 cursor-pointer font-medium text-gray-900">
                  Do I need proof of employment to use corporate codes?
                  <span className="transition-transform group-open:rotate-180">▼</span>
                </summary>
                <div className="px-4 pb-4 text-gray-600">
                  Yes, most corporate codes require verification at the rental counter. This typically includes a company ID badge, business card, or pay stub. Some association codes (like AAA, AARP) require membership card verification.
                </div>
              </details>
              <details className="bg-white rounded-lg border border-gray-200 group">
                <summary className="flex justify-between items-center p-4 cursor-pointer font-medium text-gray-900">
                  Can I combine corporate codes with other discounts?
                  <span className="transition-transform group-open:rotate-180">▼</span>
                </summary>
                <div className="px-4 pb-4 text-gray-600">
                  Corporate rates typically cannot be combined with coupon codes or promotional discounts. However, they often include benefits like free upgrades, additional driver coverage, or waived young driver fees that provide additional value.
                </div>
              </details>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
