import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import type { Metadata } from 'next';
import { cache } from 'react';
// 核心优化：引入客户端实时搜索列表组件
import BrandCodeList from '@/components/BrandCodeList';

// ISR：每小时重新生成一次页面，足够快，不占用构建资源
export const revalidate = 3600;

// 核心优化：移除 generateStaticParams，释放 Vercel Build Time 压力

const getBrandData = cache(async (slug: string) => {
  return prisma.brand.findUnique({
    where: { slug },
    include: {
      codes: {
        include: { company: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
});

export async function generateMetadata({ params }: { params: Promise<{ brand: string }> }): Promise<Metadata> {
  const { brand: slug } = await params;
  const brand = await getBrandData(slug);

  if (!brand) return { title: 'Brand Not Found' };

  const termMap: Record<string, string> = {
    hertz: 'CDP', avis: 'AWD', enterprise: 'ECM', national: 'Contract ID',
    alamo: 'Corp ID', budget: 'BCD', payless: 'Corp ID', dollar: 'Corporate', thrifty: 'Corporate',
  };
  const brandTerm = termMap[slug.toLowerCase()] || 'Corporate';

  return {
    title: `${brand.name} Corporate Codes 2026 | ${brandTerm} Discounts`,
    description: `Verified database of ${brand.name} corporate discount codes (${brandTerm}). Save up to 25% on your business and leisure car rentals.`,
    alternates: {
      canonical: `https://carcorporatecodes.com/${brand.slug}`,
    }
  };
}

export default async function BrandPage({ params }: { params: Promise<{ brand: string }> }) {
  const { brand: currentBrandSlug } = await params;

  const brandData = await getBrandData(currentBrandSlug);
  if (!brandData) notFound();

  // 获取其他品牌推荐
  const otherBrands = await prisma.brand.findMany({
    where: { NOT: { id: brandData.id } },
    take: 3,
    include: { _count: { select: { codes: true } } },
  });

  const termMap: Record<string, string> = {
    hertz: 'CDP', avis: 'AWD', enterprise: 'ECM', national: 'Contract ID', budget: 'BCD'
  };
  const term = termMap[currentBrandSlug.toLowerCase()] || 'Corporate Code';

  // 简化的 JSON-LD（移除硬编码 FAQ）
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `${brandData.name} Corporate Codes 2026`,
    description: `Verified database of ${brandData.name} corporate discount codes.`,
    url: `https://carcorporatecodes.com/${brandData.slug}`,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: brandData.codes.map((code, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: `${code.company.name} - ${brandData.name} Corporate Code`,
        identifier: code.codeValue,
      })),
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Script
        id="json-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* 极简顶部导航 */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50 backdrop-blur-md bg-white/90">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-xl md:text-2xl font-bold text-blue-700 hover:opacity-80 transition-opacity">
            Car Corporate Codes
          </Link>
          <Link href="/search?q=" className="text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors">
            All Brands &rarr;
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 md:py-16">

        {/* H1 头部焦点区 */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
            Verified Database
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 capitalize tracking-tight">
            {brandData.name} <span className="text-blue-600">{term}s</span> 2026
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Search our live database of {brandData.codes.length} active corporate discount programs.
            Find your company or university to unlock exclusive {brandData.name} rates.
          </p>
        </div>

        {/* 核心组件替换：抛弃臃肿的表格，引入实时搜索客户端组件 */}
        <section className="mb-16">
          <BrandCodeList codes={brandData.codes} brandName={brandData.name} />
        </section>

        {/* AI 引导闭环 */}
        <div className="bg-gradient-to-br from-gray-900 to-blue-900 rounded-3xl p-8 md:p-10 text-center shadow-xl relative overflow-hidden mb-16">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-500"></div>
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-4 relative z-10">Will {brandData.name} check your ID?</h3>
          <p className="text-blue-100 mb-8 max-w-xl mx-auto relative z-10 text-sm md:text-base">
            Don&apos;t risk paying walk-up rates at the counter. Ask our AI agent if your specific code is strictly enforced at your destination airport.
          </p>
          <Link href={`/ask?q=${encodeURIComponent(`${brandData.name} corporate code ID check policy`)}`} className="relative z-10 inline-block bg-blue-500 text-white font-bold px-8 py-4 rounded-xl shadow-lg hover:bg-blue-400 transition-colors hover:scale-105 active:scale-95">
            Check ID Policy with AI
          </Link>
        </div>

        {/* 替代方案区 */}
        <section className="mb-16 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-orange-50 border border-orange-100 rounded-2xl p-6">
             <h3 className="text-lg font-bold text-orange-900 mb-2">No Employee ID?</h3>
             <p className="text-orange-800 text-sm mb-4">Use public OTA rates instead of risking corporate codes without eligibility.</p>
             <a href="https://www.discovercars.com" target="_blank" rel="nofollow sponsored noopener noreferrer" className="inline-block w-full text-center bg-orange-500 text-white font-bold py-3 rounded-lg hover:bg-orange-600 transition">Compare Public Rates</a>
          </div>

          <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Explore Other Brands</h3>
            <div className="flex flex-col gap-3">
              {otherBrands.map(b => (
                <Link key={b.id} href={`/${b.slug}`} className="flex justify-between items-center text-sm font-medium text-gray-600 hover:text-blue-600">
                  <span className="capitalize">{b.name} Codes</span>
                  <span className="bg-gray-100 px-2 py-1 rounded text-xs">{b._count.codes}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

      </main>
      <footer className="bg-gray-900 text-gray-400 text-sm text-center py-8">
        &copy; {new Date().getFullYear()} Car Corporate Codes.
      </footer>
    </div>
  );
}
