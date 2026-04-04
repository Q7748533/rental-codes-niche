import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import type { Metadata } from 'next';
import { cache } from 'react';
import MobileNav from '@/components/MobileNav';

export const revalidate = 3600;

// 解析 URL 参数，例如 'avis-ibm' 分解为 'avis' 和 'ibm'
// 动态分割：利用 URL 结构规律（第一个 - 前面的是品牌，后面的是公司）
function parseSlugs(combinedSlug: string) {
  const firstHyphenIndex = combinedSlug.indexOf('-');
  if (firstHyphenIndex === -1) return { brandSlug: '', companySlug: '' };

  return {
    brandSlug: combinedSlug.substring(0, firstHyphenIndex),
    companySlug: combinedSlug.substring(firstHyphenIndex + 1)
  };
}

// 获取代码数据
const getCodeData = cache(async (brandSlug: string, companySlug: string) => {
  return prisma.code.findFirst({
    where: {
      brand: { slug: brandSlug },
      company: { slug: companySlug }
    },
    include: { brand: true, company: true }
  });
});

// 获取该公司的其他品牌代码（横向关联）
const getLateralCodes = cache(async (companyId: string, currentBrandId: string) => {
  return prisma.code.findMany({
    where: {
      companyId: companyId,
      brandId: { not: currentBrandId }
    },
    include: { brand: true, company: true }
  });
});

// 获取安全的替代码（Leisure类型或无ID检查）
const getAlternativeCodes = cache(async (brandSlug: string, currentCodeId: string) => {
  return prisma.code.findMany({
    where: {
      brand: { slug: brandSlug },
      id: { not: currentCodeId },
      OR: [
        { codeType: 'Leisure' },
        { source: 'Public' }
      ]
    },
    include: { company: true },
    take: 3
  });
});

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { brandSlug, companySlug } = parseSlugs(slug);

  if (!brandSlug || !companySlug) return { title: 'Code Not Found' };

  const codeData = await getCodeData(brandSlug, companySlug);
  if (!codeData) return { title: 'Code Not Found' };

  const termMap: Record<string, string> = {
    hertz: 'CDP', avis: 'AWD', enterprise: 'ECM', national: 'Contract ID',
    alamo: 'Corp ID', budget: 'BCD', payless: 'Corp ID', dollar: 'Corporate', thrifty: 'Corporate'
  };
  const term = termMap[brandSlug] || 'Corporate Code';

  return {
    title: `${codeData.company.name} ${codeData.brand.name} Corporate Code (${term}) - Save 25%`,
    description: `Use the ${codeData.company.name} corporate discount code (${codeData.codeValue}) at ${codeData.brand.name}. Verified 2026 ${term} to bypass counter checks.`,
    alternates: { canonical: `https://carcorporatecodes.com/codes/${slug}` }
  };
}

export default async function CodeSpokePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { brandSlug, companySlug } = parseSlugs(slug);

  if (!brandSlug || !companySlug) notFound();

  const codeData = await getCodeData(brandSlug, companySlug);
  if (!codeData) notFound();

  const lateralCodes = await getLateralCodes(codeData.companyId, codeData.brandId);
  const alternativeCodes = await getAlternativeCodes(brandSlug, codeData.id);

  const termMap: Record<string, string> = {
    hertz: 'CDP', avis: 'AWD', enterprise: 'ECM', national: 'Contract ID',
    alamo: 'Corp ID', budget: 'BCD', payless: 'Corp ID', dollar: 'Corporate', thrifty: 'Corporate'
  };
  const term = termMap[brandSlug] || 'Corporate Code';

  // 动态生成直连预订 URL
  const getDirectBookingUrl = () => {
    switch(brandSlug) {
      case 'avis': return `https://www.avis.com/en/home?awd_number=${codeData.codeValue}`;
      case 'hertz': return `https://www.hertz.com/rentacar/reservation/?id=30000&cdp=${codeData.codeValue}`;
      case 'budget': return `https://www.budget.com/en/home?bcd_number=${codeData.codeValue}`;
      case 'enterprise': return `https://www.enterprise.com/en/car-rental.html?ECM=${codeData.codeValue}`;
      case 'national': return `https://www.nationalcar.com/en/car-rental.html?ContractID=${codeData.codeValue}`;
      case 'alamo': return `https://www.alamo.com/en/car-rental.html?CorpID=${codeData.codeValue}`;
      default: return `https://www.${brandSlug}.com`;
    }
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        name: `${codeData.company.name} ${codeData.brand.name} Corporate Code`,
        description: `Use ${codeData.codeValue} for ${codeData.company.name} discounts at ${codeData.brand.name}.`,
        url: `https://carcorporatecodes.com/codes/${slug}`,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://carcorporatecodes.com' },
          { '@type': 'ListItem', position: 2, name: codeData.brand.name, item: `https://carcorporatecodes.com/${brandSlug}` },
          { '@type': 'ListItem', position: 3, name: `${codeData.company.name} Code`, item: `https://carcorporatecodes.com/codes/${slug}` }
        ]
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: `Does ${codeData.brand.name} check ${codeData.company.name} employee ID at the counter?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: `Yes, ${codeData.brand.name} routinely audits ${codeData.company.name} ${term} usage. You should be prepared to present a valid employee badge, corporate email verification, or business card at the rental counter. Failure to provide ID may result in your reservation reverting to the standard walk-up rate.`
            }
          },
          {
            '@type': 'Question',
            name: `Can I use the ${codeData.company.name} code for ${codeData.brand.name} leisure travel?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: `The ${codeData.company.name} ${term} (${codeData.codeValue}) is primarily intended for business travel. While some corporate codes allow leisure use, ${codeData.brand.name} agents may request proof of employment. For leisure travel without ID checks, consider using public promotional codes or our AI-recommended alternatives.`
            }
          },
          {
            '@type': 'Question',
            name: `What is the ${codeData.brand.name} ${term} for ${codeData.company.name}?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: `The ${codeData.brand.name} ${term} for ${codeData.company.name} is ${codeData.codeValue}. This code provides 10-25% discount on car rentals. Enter this code in the ${term} field during checkout at ${codeData.brand.name}.com or present it at the counter.`
            }
          }
        ]
      }
    ]
  };

  const isBusinessCode = !codeData.codeType || codeData.codeType.toLowerCase() === 'business';

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Script id="json-ld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50 backdrop-blur-md bg-white/90">
        <div className="max-w-6xl mx-auto px-4 py-3 md:py-4 flex justify-between items-center">
          <Link href="/" className="text-xl md:text-2xl font-bold text-blue-700 hover:opacity-80 transition-opacity">
            Car Corporate Codes
          </Link>
          <div className="flex items-center">
            <nav className="hidden md:flex items-center space-x-6 text-sm font-medium text-gray-600">
              <Link href={`/${brandSlug}`} className="hover:text-blue-600 capitalize">{codeData.brand.name} Codes</Link>
              <Link href="/ask" className="hover:text-blue-600">Ask AI</Link>
            </nav>
            <MobileNav />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* 面包屑 */}
        <nav className="text-sm text-gray-500 mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2">
            <li><Link href="/" className="hover:text-blue-600 transition-colors">Home</Link></li>
            <li className="text-gray-400">/</li>
            <li><Link href={`/${brandSlug}`} className="hover:text-blue-600 transition-colors capitalize">{codeData.brand.name}</Link></li>
            <li className="text-gray-400">/</li>
            <li>
              <Link href={`/organization/${companySlug}`} className="hover:text-blue-600 transition-colors font-medium">
                {codeData.company.name}
              </Link>
            </li>
          </ol>
        </nav>

        {/* 核心信息卡片 */}
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden mb-12">
          <div className="bg-blue-700 text-white p-8 text-center">
            <h1 className="text-3xl md:text-5xl font-extrabold mb-4">
              {codeData.brand.name} {codeData.company.name} Code
            </h1>
            <p className="text-blue-100 text-lg">Updated April 2026 · Save 10-25% on your rental</p>
          </div>

          <div className="p-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
              <div>
                <p className="text-sm text-gray-500 uppercase tracking-widest font-bold mb-1">{term} Number</p>
                <div className="text-4xl font-black text-gray-900 font-mono tracking-wider bg-gray-100 px-4 py-2 rounded-lg inline-block">
                  {codeData.codeValue}
                </div>
              </div>
              <a
                href={getDirectBookingUrl()}
                target="_blank"
                rel="nofollow sponsored noopener noreferrer"
                className="w-full md:w-auto text-center bg-orange-500 hover:bg-orange-600 text-white text-lg font-bold py-4 px-8 rounded-xl shadow-md transition-transform hover:scale-105"
              >
                Use Code at {codeData.brand.name}.com →
              </a>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-gray-100 pt-6">
              <div className="text-center">
                <span className="block text-2xl font-bold text-green-600 mb-1">10-25%</span>
                <span className="text-xs text-gray-500 uppercase font-semibold">Discount</span>
              </div>
              <div className="text-center">
                <span className="block text-2xl mb-1">{isBusinessCode ? '⚠️' : '✅'}</span>
                <span className="text-xs text-gray-500 uppercase font-semibold">{isBusinessCode ? 'ID Check Likely' : 'No ID Check'}</span>
              </div>
              <div className="text-center">
                <span className="block text-2xl mb-1">✅</span>
                <span className="text-xs text-gray-500 uppercase font-semibold">Earns Points</span>
              </div>
              <div className="text-center">
                <span className="block text-2xl mb-1">🌍</span>
                <span className="text-xs text-gray-500 uppercase font-semibold">Global Usage</span>
              </div>
            </div>
          </div>
        </div>

        {/* AI 安全防御网 */}
        {isBusinessCode && (
          <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-r-xl mb-12">
            <h3 className="text-red-800 font-bold text-lg mb-2">No {codeData.company.name} Badge? Don&apos;t Risk It.</h3>
            <p className="text-red-700 text-sm mb-4">
              {codeData.brand.name} counter agents are highly trained to audit {codeData.company.name} corporate codes.
              If you cannot provide a physical employee ID or verifiable corporate email, your reservation will immediately
              default to the inflated walk-up rate.
            </p>
            <Link
              href={`/ask?q=${encodeURIComponent(`Safe public promo codes for ${codeData.brand.name} without ID check`)}`}
              className="inline-block bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg text-sm transition-colors shadow-sm"
            >
              Find Safe Public Codes via AI →
            </Link>
          </div>
        )}

        {/* 替代码推荐 */}
        {alternativeCodes.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Safer Alternatives for {codeData.brand.name}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {alternativeCodes.map(alt => (
                <Link
                  key={alt.id}
                  href={`/codes/${brandSlug}-${alt.company.slug}`}
                  className="bg-white border border-gray-200 p-5 rounded-xl hover:border-green-500 hover:shadow-md transition-all group"
                >
                  <div className="font-bold text-gray-900 group-hover:text-green-600 mb-1">
                    {alt.company.name}
                  </div>
                  <div className="text-gray-500 font-mono text-sm">{alt.codeValue}</div>
                  <div className="mt-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-green-50 text-green-600 uppercase tracking-wider border border-green-200">
                      ✅ Safe to Use
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 横向实体关联网络 */}
        {lateralCodes.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{codeData.company.name} Codes at Other Rental Chains</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {lateralCodes.map(c => (
                <Link
                  key={c.id}
                  href={`/codes/${c.brand.slug}-${c.company.slug}`}
                  className="bg-white border border-gray-200 p-5 rounded-xl hover:border-blue-500 hover:shadow-md transition-all group"
                >
                  <div className="font-bold text-gray-900 group-hover:text-blue-600 mb-1 capitalize">
                    {c.brand.name}
                  </div>
                  <div className="text-gray-500 font-mono text-sm">{c.codeValue}</div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 专属 FAQ 内容 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <details className="group bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-blue-300 transition-colors">
              <summary className="font-medium text-gray-900 flex justify-between items-center">
                Does {codeData.brand.name} check {codeData.company.name} employee ID at the counter?
                <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-3 text-gray-600 text-sm leading-relaxed">
                Yes, {codeData.brand.name} routinely audits {codeData.company.name} {term} usage. You should be prepared to present a valid employee badge, corporate email verification, or business card at the rental counter. Failure to provide ID may result in your reservation reverting to the standard walk-up rate.
              </p>
            </details>
            <details className="group bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-blue-300 transition-colors">
              <summary className="font-medium text-gray-900 flex justify-between items-center">
                Can I use the {codeData.company.name} code for {codeData.brand.name} leisure travel?
                <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-3 text-gray-600 text-sm leading-relaxed">
                The {codeData.company.name} {term} ({codeData.codeValue}) is primarily intended for business travel. While some corporate codes allow leisure use, {codeData.brand.name} agents may request proof of employment. For leisure travel without ID checks, consider using public promotional codes or our AI-recommended alternatives.
              </p>
            </details>
            <details className="group bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-blue-300 transition-colors">
              <summary className="font-medium text-gray-900 flex justify-between items-center">
                What is the {codeData.brand.name} {term} for {codeData.company.name}?
                <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-3 text-gray-600 text-sm leading-relaxed">
                The {codeData.brand.name} {term} for {codeData.company.name} is {codeData.codeValue}. This code provides 10-25% discount on car rentals. Enter this code in the {term} field during checkout at {codeData.brand.name}.com or present it at the counter.
              </p>
            </details>
          </div>
        </section>

        {/* 返回品牌页 */}
        <div className="text-center">
          <Link
            href={`/${brandSlug}`}
            className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
            </svg>
            View All {codeData.brand.name} Codes
          </Link>
        </div>
      </main>

      {/* 页脚 */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
            <p>&copy; 2026 Car Corporate Codes. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="/about" className="hover:text-gray-900 transition-colors">About</Link>
              <Link href="/privacy" className="hover:text-gray-900 transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-gray-900 transition-colors">Terms</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
