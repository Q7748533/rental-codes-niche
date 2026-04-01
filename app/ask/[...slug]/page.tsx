import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }): Promise<Metadata> {
  const { slug } = await params;
  // 处理 slug 数组，移除 .html 后缀
  const fullSlug = slug.join('/').replace(/\.html$/, '');
  const aiQuery = await prisma.aiQuery.findUnique({ where: { slug: fullSlug + '.html' } });

  if (!aiQuery) {
    // 尝试不带 .html 的查找
    const aiQueryNoHtml = await prisma.aiQuery.findUnique({ where: { slug: fullSlug } });
    if (!aiQueryNoHtml) {
      return { title: 'Not Found' };
    }
    return {
      title: aiQueryNoHtml.seoTitle,
      description: aiQueryNoHtml.aiSummary,
    };
  }

  const canonicalUrl = `https://carcorporatecodes.com/ask/${aiQuery.slug}`;

  return {
    title: aiQuery.seoTitle,
    description: aiQuery.aiSummary,
    keywords: ['car rental corporate codes', 'CDP', 'AWD', 'discount codes', 'rental car savings'],
    authors: [{ name: 'Car Corporate Codes AI' }],
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
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: aiQuery.seoTitle,
      description: aiQuery.aiSummary,
      type: 'article',
      publishedTime: aiQuery.createdAt.toISOString(),
      modifiedTime: aiQuery.createdAt.toISOString(),
      authors: ['Car Corporate Codes AI'],
      url: canonicalUrl,
      siteName: 'Car Corporate Codes',
    },
    twitter: {
      card: 'summary_large_image',
      title: aiQuery.seoTitle,
      description: aiQuery.aiSummary,
    },
  };
}

export default async function AiGuidePage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  // 处理 slug 数组，移除 .html 后缀
  const fullSlug = slug.join('/').replace(/\.html$/, '');
  
  // 先尝试带 .html 的查找
  let aiQuery = await prisma.aiQuery.findUnique({
    where: { slug: fullSlug + '.html' },
  });

  // 如果没找到，尝试不带 .html 的查找
  if (!aiQuery) {
    aiQuery = await prisma.aiQuery.findUnique({
      where: { slug: fullSlug },
    });
  }

  if (!aiQuery) {
    notFound();
  }

  // 增加浏览次数
  await prisma.aiQuery.update({
    where: { slug: aiQuery.slug },
    data: { viewCount: { increment: 1 } },
  });

  // 获取相关文章（排除当前文章，按浏览量排序）
  const relatedArticles = await prisma.aiQuery.findMany({
    where: {
      slug: { not: aiQuery.slug },
    },
    orderBy: [
      { viewCount: 'desc' },
      { createdAt: 'desc' },
    ],
    take: 4,
    select: {
      slug: true,
      seoTitle: true,
      aiSummary: true,
      viewCount: true,
    },
  });

  const canonicalUrl = `https://carcorporatecodes.com/ask/${aiQuery.slug}`;

  // JSON-LD 结构化数据
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        '@id': `${canonicalUrl}#article`,
        headline: aiQuery.seoTitle,
        description: aiQuery.aiSummary,
        url: canonicalUrl,
        datePublished: aiQuery.createdAt.toISOString(),
        dateModified: aiQuery.createdAt.toISOString(),
        author: {
          '@type': 'Organization',
          name: 'Car Corporate Codes AI',
          '@id': 'https://carcorporatecodes.com/#organization',
        },
        publisher: {
          '@type': 'Organization',
          name: 'Car Corporate Codes',
          '@id': 'https://carcorporatecodes.com/#organization',
          logo: {
            '@type': 'ImageObject',
            url: 'https://carcorporatecodes.com/logo.png',
          },
        },
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': `${canonicalUrl}#webpage`,
        },
        articleSection: 'Car Rental Guides',
        wordCount: aiQuery.seoContent?.length || 0,
      },
      {
        '@type': 'WebPage',
        '@id': `${canonicalUrl}#webpage`,
        url: canonicalUrl,
        name: aiQuery.seoTitle,
        description: aiQuery.aiSummary,
        isPartOf: {
          '@id': 'https://carcorporatecodes.com/#website',
        },
        breadcrumb: {
          '@id': `${canonicalUrl}#breadcrumb`,
        },
        datePublished: aiQuery.createdAt.toISOString(),
        dateModified: aiQuery.createdAt.toISOString(),
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${canonicalUrl}#breadcrumb`,
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
            name: 'Rental Codes',
            item: 'https://carcorporatecodes.com/ask',
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: aiQuery.seoTitle,
            item: canonicalUrl,
          },
        ],
      },
      {
        '@type': 'FAQPage',
        '@id': `${canonicalUrl}#faq`,
        mainEntity: [
          {
            '@type': 'Question',
            name: `What are the best corporate codes for ${aiQuery.userPrompt}?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: aiQuery.aiSummary,
            },
          },
        ],
      },
    ],
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* JSON-LD 结构化数据 */}
      <Script
        id="json-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* 简洁导航栏 */}
      <header className="border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium">
            &larr; Back to Car Corporate Codes
          </Link>
        </div>
      </header>

      {/* 主内容 */}
      <main className="max-w-3xl mx-auto px-4 py-8 md:py-12">
        {/* 面包屑 */}
        <nav className="mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 text-sm text-gray-500">
            <li><Link href="/" className="hover:text-blue-600">Home</Link></li>
            <li className="text-gray-400">/</li>
            <li className="text-gray-900">Rental Codes</li>
          </ol>
        </nav>

        {/* 标题 */}
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-6 leading-tight">
          {aiQuery.seoTitle}
        </h1>

        {/* 元信息行 */}
        <div className="flex items-center gap-4 text-sm text-gray-500 mb-6 pb-4 border-b border-gray-200">
          <span>{aiQuery.createdAt.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
          <span>•</span>
          <span>{aiQuery.viewCount.toLocaleString()} views</span>
        </div>

        {/* 文章内容 */}
        <article 
          className="prose prose-base max-w-none 
            prose-headings:text-gray-900 prose-headings:font-bold prose-headings:mt-6 prose-headings:mb-3
            prose-h2:text-lg prose-h2:md:text-xl prose-h2:text-gray-800
            prose-p:text-gray-700 prose-p:leading-7 prose-p:mb-4
            prose-strong:text-gray-900 prose-strong:font-semibold
            prose-strong:bg-blue-50 prose-strong:px-1 prose-strong:py-0.5 prose-strong:rounded
            prose-li:text-gray-700 prose-li:mb-1 prose-li:leading-7
            prose-ul:my-4 prose-ul:list-disc prose-ul:pl-5
            prose-ol:my-4 prose-ol:list-decimal prose-ol:pl-5"
          dangerouslySetInnerHTML={{ __html: aiQuery.seoContent }}
        />

        {/* Insider Tip */}
        <div className="mt-8 p-4 bg-amber-50 border-l-4 border-amber-400">
          <p className="text-amber-900 text-sm leading-relaxed">
            <span className="font-bold">💡 Insider Tip:</span>{' '}
            Book directly on the rental company&apos;s website and avoid third-party sites like Expedia or Kayak. 
            I&apos;ve seen $50+ in surprise fees added at check-in for third-party bookings. 
            Corporate rate bookings earn full loyalty points and qualify for free promotions.
          </p>
        </div>

        {/* 免责声明 */}
        <div className="mt-6 text-xs text-gray-500">
          <p>
            Disclaimer: Corporate codes require eligibility verification. 
            Always check with the rental company and have proper documentation ready.
          </p>
        </div>

        {/* 互动反馈 */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-3">Was this guide helpful?</p>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors">
              👍 Yes
            </button>
            <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors">
              👎 No
            </button>
          </div>
        </div>

        {/* 相关文章推荐 */}
        {relatedArticles.length > 0 && (
          <div className="mt-10 pt-8 border-t border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4">You May Also Like</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {relatedArticles.map((article) => (
                <Link
                  key={article.slug}
                  href={`/ask/${article.slug}`}
                  className="block p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
                >
                  <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {article.seoTitle}
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                    {article.aiSummary}
                  </p>
                  <span className="text-xs text-gray-400">
                    {article.viewCount.toLocaleString()} views
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* CTA 区域 */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-gray-700 mb-3 text-sm">
            Want a personalized recommendation for your specific situation?
          </p>
          <Link
            href="/"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium text-sm transition-colors"
          >
            Ask AI Rental Code Finder
          </Link>
        </div>
      </main>

      {/* 页脚 */}
      <footer className="bg-gray-900 text-gray-300 py-12 mt-16">
        <div className="max-w-3xl mx-auto px-4">
          <div className="mb-8">
            <h3 className="text-white text-lg font-bold mb-4">Car Corporate Codes</h3>
            <p className="text-sm text-gray-400">
              Database of car rental corporate codes and discounts. Updated regularly for accuracy.
            </p>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-500">
            <p>&copy; {new Date().getFullYear()} Car Corporate Codes. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
