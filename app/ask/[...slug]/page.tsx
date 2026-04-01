import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import type { Metadata } from 'next';

// 强制动态渲染，避免构建时查询数据库
export const dynamic = 'force-dynamic';

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

  // 动态生成关键词
  const generateKeywords = (title: string, prompt: string): string[] => {
    const baseKeywords = ['car rental corporate codes', 'CDP', 'discount codes', 'rental car savings'];
    
    // 从标题提取关键词
    const titleWords = title.toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !['the', 'and', 'for', 'with', 'how', 'what', 'are', 'best', 'top', 'save', 'use', 'get', 'your', 'you', 'can', 'using'].includes(w));
    
    // 从 prompt 提取品牌名
    const brandMatches = prompt.match(/\b(hertz|enterprise|avis|budget|national|alamo|dollar|thrifty)\b/gi) || [];
    const brandKeywords = brandMatches.map(b => `${b.toLowerCase()} corporate code`);
    
    // 提取公司名（常见大公司）
    const companyMatches = prompt.match(/\b(amazon|google|microsoft|apple|ibm|deloitte|kpmg|pwc|ey|accenture|fedex|ups|ibm|ge|att|verizon|comcast)\b/gi) || [];
    const companyKeywords = companyMatches.map(c => `${c.toLowerCase()} employee discount`);
    
    // 提取代码类型
    const codeTypeKeywords: string[] = [];
    if (prompt.toLowerCase().includes('cdp') || title.toLowerCase().includes('cdp')) {
      codeTypeKeywords.push('CDP code', 'corporate discount program');
    }
    if (prompt.toLowerCase().includes('awd') || title.toLowerCase().includes('awd')) {
      codeTypeKeywords.push('AWD code', 'avis worldwide discount');
    }
    if (prompt.toLowerCase().includes('pc') || title.toLowerCase().includes('pc')) {
      codeTypeKeywords.push('PC code', 'promotion code');
    }
    
    // 提取地点
    const locationMatches = prompt.match(/\b(new york|los angeles|chicago|houston|phoenix|philadelphia|san antonio|san diego|dallas|san jose|austin|jacksonville|fort worth|columbus|charlotte|san francisco|indianapolis|seattle|denver|washington|boston|el paso|detroit|nashville|portland|oklahoma city|las vegas|louisville|baltimore|milwaukee|albuquerque|tucson|fresno|sacramento|mesa|kansas city|atlanta|long beach|colorado springs|raleigh|miami|virginia beach|omaha|oakland|minneapolis|tulsa|arlington|wichita|bakersfield)\b/gi) || [];
    const locationKeywords = locationMatches.map(l => `${l.toLowerCase()} car rental`);
    
    // 合并所有关键词并去重
    const allKeywords = [...baseKeywords, ...titleWords.slice(0, 5), ...brandKeywords, ...companyKeywords, ...codeTypeKeywords, ...locationKeywords];
    return [...new Set(allKeywords)].slice(0, 15); // 最多15个关键词
  };

  const dynamicKeywords = generateKeywords(aiQuery.seoTitle, aiQuery.userPrompt);

  return {
    title: aiQuery.seoTitle,
    description: aiQuery.aiSummary,
    keywords: dynamicKeywords,
    authors: [{ name: 'Car Corporate Codes' }],
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
      authors: ['Car Corporate Codes'],
      url: canonicalUrl,
      siteName: 'Car Corporate Codes',
      images: [
        {
          url: 'https://carcorporatecodes.com/og-image.svg',
          width: 1200,
          height: 630,
          alt: aiQuery.seoTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: aiQuery.seoTitle,
      description: aiQuery.aiSummary,
      images: ['https://carcorporatecodes.com/og-image.svg'],
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
          name: 'Car Corporate Codes',
          '@id': 'https://carcorporatecodes.com/#organization',
        },
        publisher: {
          '@type': 'Organization',
          name: 'Car Corporate Codes',
          '@id': 'https://carcorporatecodes.com/#organization',
          logo: {
            '@type': 'ImageObject',
            url: 'https://carcorporatecodes.com/og-image.svg',
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
          {
            '@type': 'Question',
            name: 'How much can I save with car rental corporate codes?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Car rental corporate codes typically save you 10-25% off standard rates. Savings vary by rental company, location, vehicle type, and dates. Some corporate codes also include additional benefits like free upgrades, waived fees, or additional driver privileges.',
            },
          },
          {
            '@type': 'Question',
            name: 'Do I need to prove eligibility for corporate codes?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Most corporate codes require proof of eligibility at the rental counter, such as a company ID, business card, or pay stub. However, some codes marked as "Leisure" or "Public" may not require verification. Always check the specific requirements for each code before booking.',
            },
          },
          {
            '@type': 'Question',
            name: 'Can I combine corporate codes with other discounts?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Corporate codes generally cannot be combined with other promotional codes or coupons. However, you can often stack them with loyalty program benefits, credit card rewards, or cashback offers. Always compare the corporate rate with publicly available deals to ensure you\'re getting the best price.',
            },
          },
          {
            '@type': 'Question',
            name: 'What is the difference between CDP and PC codes?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'CDP (Corporate Discount Program) codes are negotiated rates for employees of specific companies or members of organizations. PC (Promotion Code) codes are special promotional rates that may be available to the general public or specific groups. CDP codes typically offer deeper discounts but require eligibility verification.',
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
            <li><Link href="/ask" className="hover:text-blue-600">Ask</Link></li>
            <li className="text-gray-400">/</li>
            <li className="text-gray-900 truncate max-w-[200px]">{aiQuery.seoTitle}</li>
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
