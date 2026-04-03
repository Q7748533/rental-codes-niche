import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import type { Metadata } from 'next';
import { cache } from 'react';
import BrandCodeList from '@/components/BrandCodeList';
import MobileNav from '@/components/MobileNav';

export const revalidate = 3600;
// 删除了 generateStaticParams，释放构建压力

// 极致的 select：完美对接爬虫 6 字段
const getBrandData = cache(async (slug: string) => {
  return prisma.brand.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      updatedAt: true,
      codes: {
        select: {
          id: true,
          codeValue: true,
          description: true,
          codeType: true,
          source: true,
          company: { select: { name: true } }
        },
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
    alternates: { canonical: `https://carcorporatecodes.com/${brand.slug}` }
  };
}

export default async function BrandPage({ params }: { params: Promise<{ brand: string }> }) {
  const { brand: currentBrandSlug } = await params;
  const brandData = await getBrandData(currentBrandSlug);
  if (!brandData) notFound();

  const otherBrands = await prisma.brand.findMany({
    where: { NOT: { id: brandData.id } },
    take: 3,
    include: { _count: { select: { codes: true } } },
  });

  const termMap: Record<string, string> = {
    hertz: 'CDP', avis: 'AWD', enterprise: 'ECM', national: 'Contract ID', budget: 'BCD'
  };
  const term = termMap[currentBrandSlug.toLowerCase()] || 'Corporate Code';

  // 修复后的数组化 JSON-LD (包含 Breadcrumb)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        name: `${brandData.name} Corporate Codes 2026`,
        description: `Verified database of ${brandData.name} corporate discount codes.`,
        url: `https://carcorporatecodes.com/${brandData.slug}`,
        mainEntity: {
          '@type': 'ItemList',
          itemListElement: brandData.codes.map((code, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: `${code.company.name} - ${brandData.name} Code`,
            identifier: code.codeValue,
          })),
        }
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://carcorporatecodes.com' },
          { '@type': 'ListItem', position: 2, name: `${brandData.name} Codes`, item: `https://carcorporatecodes.com/${brandData.slug}` }
        ]
      }
    ]
  };

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
              <Link href="/ask" className="hover:text-blue-600">Ask AI</Link>
            </nav>
            <MobileNav />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
            Verified Database
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 capitalize tracking-tight">
            {brandData.name} <span className="text-blue-600">{term}s</span> 2026
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Search our live database of {brandData.codes.length} active corporate discount programs.
          </p>
        </div>

        {/* 唯一的列表入口，所有复杂 UI 交给客户端 */}
        <section className="mb-16">
          <BrandCodeList codes={brandData.codes} brandName={brandData.name} />
        </section>

        {/* 内部生态引流 */}
        <section className="mb-16 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 flex flex-col justify-between">
             <div>
               <h3 className="text-lg font-bold text-emerald-900 mb-2">No Corporate ID?</h3>
               <p className="text-emerald-800 text-sm mb-4">
                 Don&apos;t risk paying walk-up rates at the counter. Let our AI find 100% safe, public promo codes and association discounts for {brandData.name}.
               </p>
             </div>
             <Link
               href={`/ask?q=${encodeURIComponent(`Safe public promo codes and association discounts for ${brandData.name}`)}`}
               className="inline-block w-full text-center bg-emerald-600 text-white font-bold py-3 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm mt-auto"
             >
               Find Safe Codes via AI
             </Link>
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

      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h4 className="text-white font-bold mb-4">Car Corporate Codes</h4>
              <p className="text-sm text-gray-500">Verified database of corporate discount codes for major rental brands. Save 10-25% on your next rental.</p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
                <li><Link href="/ask" className="hover:text-white transition-colors">Ask AI</Link></li>
                <li><Link href="/search?q=" className="hover:text-white transition-colors">Search</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-500">
            <p>&copy; {new Date().getFullYear()} Car Corporate Codes. All rights reserved.</p>
            <p className="mt-2">Corporate codes require eligibility verification. Not affiliated with any rental companies.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
