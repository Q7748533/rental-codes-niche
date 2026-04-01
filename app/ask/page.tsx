import { prisma } from '@/lib/db';
import Link from 'next/link';
import type { Metadata } from 'next';

// ISR 静态缓存：1小时重新验证
export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Car Rental Guides & Money-Saving Tips | Car Corporate Codes',
  description: 'Browse our expert car rental guides, corporate code tutorials, and money-saving tips for Hertz, Enterprise, Avis, and more.',
  keywords: ['car rental guides', 'rental car tips', 'corporate code tutorials', 'save on car rentals'],
  openGraph: {
    title: 'Car Rental Guides & Money-Saving Tips',
    description: 'Browse expert car rental guides and money-saving tips.',
    type: 'website',
    url: 'https://carcorporatecodes.com/ask',
    siteName: 'Car Corporate Codes',
  },
  alternates: {
    canonical: 'https://carcorporatecodes.com/ask',
  },
};

export default async function AskPage() {
  const articles = await prisma.aiQuery.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100, // 限制查询数量，防止数据库过载
    select: {
      slug: true,
      seoTitle: true,
      aiSummary: true,
      createdAt: true,
    },
  });

  // JSON-LD 结构化数据
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        '@id': 'https://carcorporatecodes.com/ask/#breadcrumb',
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
            name: 'AI Guides',
            item: 'https://carcorporatecodes.com/ask',
          },
        ],
      },
      {
        '@type': 'CollectionPage',
        '@id': 'https://carcorporatecodes.com/ask/#webpage',
        url: 'https://carcorporatecodes.com/ask',
        name: 'Car Rental Guides & Money-Saving Tips',
        description: 'Browse our expert car rental guides and money-saving tips.',
        isPartOf: {
          '@id': 'https://carcorporatecodes.com/#website',
        },
        breadcrumb: {
          '@id': 'https://carcorporatecodes.com/ask/#breadcrumb',
        },
        mainEntity: {
          '@type': 'ItemList',
          itemListElement: articles.map((article, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            url: `https://carcorporatecodes.com/ask/${article.slug.replace(/\.html$/, '')}.html`,
            name: article.seoTitle,
          })),
        },
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-xl font-bold text-blue-700">
              Car Corporate Codes
            </Link>
            <nav className="text-sm text-gray-600">
              <Link href="/" className="hover:text-blue-600">← Back to Home</Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* H1 */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Car Rental Guides & Money-Saving Tips
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Browse our collection of {articles.length} expert guides to help you save money on car rentals with corporate codes and discount strategies.
          </p>
        </div>

        {/* Articles Grid */}
        {articles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <Link
                key={article.slug}
                href={`/ask/${article.slug.replace(/\.html$/, '')}.html`}
                className="block bg-white p-6 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
              >
                <h2 className="text-lg font-semibold text-gray-900 mb-3 line-clamp-2">
                  {article.seoTitle}
                </h2>
                <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                  {article.aiSummary}
                </p>
                <div className="text-xs text-gray-400">
                  {new Date(article.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-lg border border-dashed border-gray-300">
            <p className="text-gray-500 mb-4">No articles yet.</p>
            <Link
              href="/"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Ask our AI to create one →
            </Link>
          </div>
        )}

        {/* Back to Home */}
        <div className="mt-12 text-center">
          <Link
            href="/"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Home
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 mt-16">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} Car Corporate Codes. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
