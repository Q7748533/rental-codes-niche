import type { Metadata } from 'next';
import Link from 'next/link';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'Terms of Service | Car Corporate Codes',
  description: 'Terms and conditions for using Car Corporate Codes car rental code database.',
  openGraph: {
    title: 'Terms of Service | Car Corporate Codes',
    description: 'Terms and conditions for using Car Corporate Codes car rental code database.',
    type: 'website',
    url: 'https://carcorporatecodes.com/terms',
    siteName: 'Car Corporate Codes',
  },
  twitter: {
    card: 'summary',
    title: 'Terms of Service | Car Corporate Codes',
    description: 'Terms and conditions for using Car Corporate Codes.',
  },
  alternates: {
    canonical: 'https://carcorporatecodes.com/terms',
  },
};

export default function TermsPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Terms of Service | Car Corporate Codes',
    description: 'Terms and conditions for using Car Corporate Codes car rental code database.',
    url: 'https://carcorporatecodes.com/terms',
    isPartOf: {
      '@id': 'https://carcorporatecodes.com/#website',
    },
    dateModified: '2026-01-01',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Script
        id="json-ld-terms"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium">
            &larr; Back to Car Corporate Codes
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Service Description</h2>
            <p className="text-gray-600 leading-relaxed">
              Car Corporate Codes provides car rental corporate code information for educational
              and informational purposes. We do not guarantee that any code will work
              at any specific location.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">User Responsibility</h2>
            <p className="text-gray-600 leading-relaxed">
              Users are responsible for verifying their eligibility to use any corporate
              code. Rental companies reserve the right to verify eligibility at pickup.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">AI Recommendations</h2>
            <p className="text-gray-600 leading-relaxed">
              Our AI Rental Code Finder provides recommendations based on available data and
              user reports. Recommendations should be verified independently.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Disclaimer</h2>
            <p className="text-gray-600 leading-relaxed">
              We are not affiliated with any rental company. All trademarks and codes
              belong to their respective owners. Use at your own risk.
            </p>
          </section>

          <div className="pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Effective: January 1, 2026
            </p>
          </div>
        </div>
      </main>

      <footer className="bg-gray-900 text-gray-300 py-8 mt-16">
        <div className="max-w-3xl mx-auto px-4 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} Car Corporate Codes. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
