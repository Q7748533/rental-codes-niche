import type { Metadata } from 'next';
import Link from 'next/link';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'Privacy Policy | Car Corporate Codes',
  description: 'Learn how Car Corporate Codes collects, uses, and protects your personal information.',
  openGraph: {
    title: 'Privacy Policy | Car Corporate Codes',
    description: 'Learn how Car Corporate Codes collects, uses, and protects your personal information.',
    type: 'website',
    url: 'https://carcorporatecodes.com/privacy',
    siteName: 'Car Corporate Codes',
  },
  twitter: {
    card: 'summary',
    title: 'Privacy Policy | Car Corporate Codes',
    description: 'Learn how Car Corporate Codes protects your personal information.',
  },
  alternates: {
    canonical: 'https://carcorporatecodes.com/privacy',
  },
};

export default function PrivacyPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Privacy Policy | Car Corporate Codes',
    description: 'Learn how Car Corporate Codes collects, uses, and protects your personal information.',
    url: 'https://carcorporatecodes.com/privacy',
    isPartOf: {
      '@id': 'https://carcorporatecodes.com/#website',
    },
    dateModified: '2026-01-01',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Script
        id="json-ld-privacy"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <header className="bg-white border-b border-gray-200" role="banner" aria-label="Site header">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium" aria-label="Back to Car Corporate Codes home">
            &larr; Back to Car Corporate Codes
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12" role="main" aria-label="Privacy policy content">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Information Collection</h2>
            <p className="text-gray-600 leading-relaxed">
              Car Corporate Codes does not collect personal information from users browsing rental codes.
              Our AI Rental Code Finder processes queries in real-time and does not store personal
              conversation data beyond anonymous page generation.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Analytics & Advertising</h2>
            <p className="text-gray-600 leading-relaxed">
              We use Google Analytics (GA4) for anonymous traffic analytics and Google AdSense
              for advertising. You can opt out at{' '}
              <a
                href="https://adssettings.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Google Ad Settings
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Data Formatting</h2>
            <p className="text-gray-600 leading-relaxed">
              We use the I-Lang Protocol for structured data formatting. I-Lang metadata
              does not collect or transmit user data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Cookies</h2>
            <p className="text-gray-600 leading-relaxed">
              We use essential cookies to maintain website functionality. Third-party
              services (Google Analytics, AdSense) may use cookies for analytics and
              personalized advertising.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Contact</h2>
            <p className="text-gray-600 leading-relaxed">
              Email: hello@carcorporatecodes.com
            </p>
            <p className="text-gray-600 leading-relaxed mt-2">
              To submit a new code, use our AI Rental Code Finder.
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
