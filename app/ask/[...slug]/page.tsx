import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import type { Metadata } from 'next';
import { cache } from 'react';

// 🌟 ISR 优化：24小时重新验证，兼顾性能和数据新鲜度
export const revalidate = 86400;

// 静态作者信息 - EEAT 信任信号
const SITE_AUTHOR = {
  name: 'Alex Chen',
  title: 'Car Rental Savings Expert',
  bio: '10+ years analyzing corporate discount programs for major rental companies',
  url: 'https://carcorporatecodes.com/about#author'
};

// 🌟 核心优化：使用 React cache 包裹数据库查询，确保 metadata 和页面共享一次查询结果
const getAiQuery = cache(async (slugArray: string[]) => {
  const fullSlug = slugArray.join('/').replace(/\.html$/, '');

  let aiQuery = await prisma.aiQuery.findUnique({
    where: { slug: fullSlug + '.html' },
  });

  if (!aiQuery) {
    aiQuery = await prisma.aiQuery.findUnique({
      where: { slug: fullSlug },
    });
  }
  return aiQuery;
});

// 🚀 终极防护：在构建时预渲染最新的 1000 篇文章，防止爬虫并发击穿数据库
export async function generateStaticParams() {
  const articles = await prisma.aiQuery.findMany({
    take: 1000,
    orderBy: { createdAt: 'desc' },
    select: { slug: true }
  });

  return articles.map((article) => {
    // 将数据库里的 "hertz-ibm.html" 拆解为 Next.js [...slug] 需要的数组格式 ['hertz-ibm']
    const cleanSlug = article.slug.replace(/\.html$/, '');
    return {
      slug: cleanSlug.split('/'),
    };
  });
}

// 提取品牌和地点用于动态 FAQ
const extractEntities = (prompt: string, title: string) => {
  const brands = ['hertz', 'enterprise', 'avis', 'budget', 'national', 'alamo', 'dollar', 'thrifty', 'fox', 'europcar'];
  const locations = ['new york', 'los angeles', 'chicago', 'houston', 'phoenix', 'philadelphia', 'san antonio', 'san diego', 'dallas', 'san jose', 'austin', 'jacksonville', 'miami', 'las vegas', 'denver', 'seattle', 'boston', 'atlanta', 'orlando', 'san francisco'];
  
  const text = (prompt + ' ' + title).toLowerCase();
  
  const detectedBrand = brands.find(b => text.includes(b)) || 'car rental';
  const detectedLocation = locations.find(l => text.includes(l)) || null;
  
  return { detectedBrand, detectedLocation };
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }): Promise<Metadata> {
  const { slug } = await params;
  const aiQuery = await getAiQuery(slug);

  if (!aiQuery) {
    return { title: 'Not Found' };
  }

  const cleanSlug = aiQuery.slug.replace(/\.html$/, '');
  const canonicalUrl = `https://carcorporatecodes.com/ask/${cleanSlug}.html`;

  // 动态生成关键词 - 扩展到 8-10 个
  const generateKeywords = (title: string, prompt: string): string[] => {
    const baseKeywords = ['car rental corporate codes', 'CDP', 'discount codes', 'rental car savings'];
    
    // 从标题提取关键词
    const titleWords = title.toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !['the', 'and', 'for', 'with', 'how', 'what', 'are', 'best', 'top', 'save', 'use', 'get', 'your', 'you', 'can', 'using', 'this', 'that', 'have', 'has', 'had'].includes(w));
    
    // 从 prompt 提取品牌名
    const brandMatches = prompt.match(/\b(hertz|enterprise|avis|budget|national|alamo|dollar|thrifty|fox|europcar)\b/gi) || [];
    const brandKeywords = [...new Set(brandMatches)].map(b => `${b.toLowerCase()} corporate code`);
    
    // 提取公司名（常见大公司）
    const companyMatches = prompt.match(/\b(amazon|google|microsoft|apple|ibm|deloitte|kpmg|pwc|ey|accenture|fedex|ups|ge|att|verizon|comcast|costco|aaa|aarp|sam)\b/gi) || [];
    const companyKeywords = [...new Set(companyMatches)].map(c => `${c.toLowerCase()} employee discount`);
    
    // 提取代码类型
    const codeTypeKeywords: string[] = [];
    if (prompt.toLowerCase().includes('cdp') || title.toLowerCase().includes('cdp')) {
      codeTypeKeywords.push('CDP code', 'corporate discount program', 'hertz CDP');
    }
    if (prompt.toLowerCase().includes('awd') || title.toLowerCase().includes('awd')) {
      codeTypeKeywords.push('AWD code', 'avis worldwide discount');
    }
    if (prompt.toLowerCase().includes('cid') || title.toLowerCase().includes('cid')) {
      codeTypeKeywords.push('CID code', 'corporate ID number');
    }
    if (prompt.toLowerCase().includes('pc') || title.toLowerCase().includes('pc')) {
      codeTypeKeywords.push('PC code', 'promotion code');
    }
    
    // 提取地点
    const locationMatches = prompt.match(/\b(new york|los angeles|chicago|houston|phoenix|philadelphia|san antonio|san diego|dallas|san jose|austin|jacksonville|fort worth|columbus|charlotte|san francisco|indianapolis|seattle|denver|washington|boston|el paso|detroit|nashville|portland|oklahoma city|las vegas|louisville|baltimore|milwaukee|albuquerque|tucson|fresno|sacramento|mesa|kansas city|atlanta|long beach|colorado springs|raleigh|miami|virginia beach|omaha|oakland|minneapolis|tulsa|arlington|wichita|bakersfield|orlando|tampa)\b/gi) || [];
    const locationKeywords = [...new Set(locationMatches)].map(l => `${l.toLowerCase()} car rental`);
    
    // 合并所有关键词并去重
    const allKeywords = [
      ...baseKeywords, 
      ...titleWords.slice(0, 5), 
      ...brandKeywords, 
      ...companyKeywords, 
      ...codeTypeKeywords, 
      ...locationKeywords
    ];
    
    // 过滤掉单字，保留高质量长尾词组，扩展到 8-10 个
    const highQualityKeywords = [...new Set(allKeywords)].filter(k => k.includes(' ') && k.length > 5);
    return highQualityKeywords.slice(0, 10); 
  };

  const dynamicKeywords = generateKeywords(aiQuery.seoTitle, aiQuery.userPrompt);

  return {
    title: aiQuery.seoTitle,
    description: aiQuery.aiSummary,
    keywords: dynamicKeywords,
    authors: [{ name: SITE_AUTHOR.name, url: SITE_AUTHOR.url }],
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
      authors: [SITE_AUTHOR.name],
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
  const aiQuery = await getAiQuery(slug);

  if (!aiQuery) {
    notFound();
  }

  // 获取相关文章
  const relatedArticles = await prisma.aiQuery.findMany({
    where: {
      slug: { not: aiQuery.slug },
    },
    orderBy: { createdAt: 'desc' },
    take: 4,
    select: {
      slug: true,
      seoTitle: true,
      aiSummary: true,
      createdAt: true,
    },
  });

  const cleanSlug = aiQuery.slug.replace(/\.html$/, '');
  const canonicalUrl = `https://carcorporatecodes.com/ask/${cleanSlug}.html`;
  
  // 提取实体用于动态 FAQ
  const { detectedBrand, detectedLocation } = extractEntities(aiQuery.userPrompt, aiQuery.seoTitle);
  const brandUpper = detectedBrand.charAt(0).toUpperCase() + detectedBrand.slice(1);

  // 🌟 动态生成 FAQ - 基于文章内容（同时用于 Schema 和视觉展示）
  const generateDynamicFaqs = () => {
    const faqs = [
      {
        '@type': 'Question',
        name: `What are the best ${detectedBrand} corporate codes${detectedLocation ? ` in ${detectedLocation}` : ''}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: aiQuery.aiSummary,
        },
      }
    ];

    // 添加品牌专属 FAQ
    if (detectedBrand !== 'car rental') {
      faqs.push({
        '@type': 'Question',
        name: `How do I use ${brandUpper} CDP codes?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `To use ${brandUpper} CDP (Corporate Discount Program) codes, enter the code in the designated field when booking on ${brandUpper}'s website or mention it when calling reservations. Have your company ID or proof of eligibility ready when picking up the vehicle.`,
        },
      });

      faqs.push({
        '@type': 'Question',
        name: `How much can I save with ${brandUpper} corporate codes?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `${brandUpper} corporate codes typically save 10-25% off standard rates, depending on location and dates. Some codes also include free upgrades, waived additional driver fees, or other perks.`,
        },
      });
    }

    // 添加通用 FAQ
    faqs.push(
      {
        '@type': 'Question',
        name: 'Do I need to prove eligibility for corporate codes?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Most corporate codes require proof of eligibility at the rental counter, such as a company ID, business card, or pay stub. However, some codes marked as "Leisure" or "Public" may not require verification. Always check the specific requirements before booking.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I combine corporate codes with other discounts?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Corporate codes generally cannot be combined with other promotional codes or coupons. However, you can often stack them with loyalty program benefits, credit card rewards, or cashback offers. Always compare rates to ensure you\'re getting the best price.',
        },
      }
    );

    return faqs;
  };

  const faqs = generateDynamicFaqs();

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
          '@type': 'Person',
          name: SITE_AUTHOR.name,
          description: SITE_AUTHOR.bio,
          url: SITE_AUTHOR.url,
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
        mainEntity: faqs,
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

        {/* 🚀 扩大 article 边界，将 EEAT 信号和 FAQ 锁死在文章语义内 */}
        <article>
          {/* 标题 */}
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-6 leading-tight">
            {aiQuery.seoTitle}
          </h1>

          {/* 元信息行 - 添加作者信息 */}
          <div className="text-sm text-gray-500 mb-6 pb-4 border-b border-gray-200 flex items-center gap-2">
            <time dateTime={aiQuery.createdAt.toISOString()}>
              {aiQuery.createdAt.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </time>
            <span>·</span>
            {/* 明确告诉爬虫这是作者 */}
            <span rel="author">By {SITE_AUTHOR.name}</span>
          </div>

          {/* 文章正文 */}
          <div
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

          {/* 作者简介 - EEAT 信号 - 语义化包裹 */}
          <footer className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                {SITE_AUTHOR.name.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{SITE_AUTHOR.name}</p>
                <p className="text-sm text-gray-600">{SITE_AUTHOR.title}</p>
                <p className="text-xs text-gray-500 mt-1">{SITE_AUTHOR.bio}</p>
              </div>
            </div>
          </footer>

          {/* 🌟 视觉 FAQ 模块 - 也在 Article 内部 */}
          <section className="mt-12 pt-8 border-t border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {faqs.map((faq: any, index: number) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <h3 className="font-semibold text-gray-900 mb-2 text-base">{faq.name}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{faq.acceptedAnswer.text}</p>
                </div>
              ))}
            </div>
          </section>
        </article>

        {/* 相关文章推荐 */}
        {relatedArticles.length > 0 && (
          <div className="mt-10 pt-8 border-t border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4">You May Also Like</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {relatedArticles.map((article) => (
                <Link
                  key={article.slug}
                  href={`/ask/${article.slug.replace(/\.html$/, '')}.html`}
                  className="block p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group flex flex-col justify-between h-full"
                >
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                      {article.seoTitle}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {article.aiSummary}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400 mt-auto">
                    {article.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
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

      {/* 简化页脚 - I-Lang 优化 */}
      <footer className="bg-gray-50 text-gray-500 py-8 mt-12 border-t border-gray-200">
        <div className="max-w-3xl mx-auto px-4 text-center text-xs">
          <p className="mb-2">
            <strong>Disclaimer:</strong> Corporate codes require eligibility verification. 
            Always check with the rental company and have proper documentation ready.
          </p>
          <p>&copy; {new Date().getFullYear()} Car Corporate Codes. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
