import type { Metadata } from 'next';
import Link from 'next/link';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'About Us | Car Corporate Codes',
  description: 'Learn about Car Corporate Codes and our mission to help travelers save on car rentals.',
  openGraph: {
    title: 'About Us | Car Corporate Codes',
    description: 'Learn about Car Corporate Codes and our mission to help travelers save on car rentals.',
    type: 'website',
    url: 'https://carcorporatecodes.com/about',
    siteName: 'Car Corporate Codes',
  },
  twitter: {
    card: 'summary',
    title: 'About Us | Car Corporate Codes',
    description: 'Learn about Car Corporate Codes and our mission to help travelers save on car rentals.',
  },
  alternates: {
    canonical: 'https://carcorporatecodes.com/about',
  },
};

export default function AboutPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: 'About Us | Car Corporate Codes',
    description: 'Learn about Car Corporate Codes and our mission to help travelers save on car rentals.',
    url: 'https://carcorporatecodes.com/about',
    isPartOf: {
      '@id': 'https://carcorporatecodes.com/#website',
    },
    mainEntity: {
      '@type': 'Organization',
      name: 'Car Corporate Codes',
      description: 'Car rental corporate codes resource helping travelers find the best rental rates.',
      url: 'https://carcorporatecodes.com',
    },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Script
        id="json-ld-about"
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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">About Car Corporate Codes</h1>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-6">
          <section>
            <p className="text-gray-600 leading-relaxed">
              Car Corporate Codes is the original car rental corporate codes resource, helping
              business and frequent travelers find the best rental rates through corporate
              discount programs.
            </p>
          </section>

          <section>
            <p className="text-gray-600 leading-relaxed">
              We maintain a verified database of corporate codes for Hertz, Enterprise,
              Avis, Budget, National, and more — updated with real user feedback.
            </p>
          </section>

          <section>
            <p className="text-gray-600 leading-relaxed">
              In 2026, we launched our AI Rental Code Finder to provide personalized code
              recommendations. Every consultation generates a rental guide page that
              helps future travelers.
            </p>
          </section>

          <section>
            <p className="text-gray-600 leading-relaxed">
              Our data is formatted using the I-Lang Protocol — an AI-native
              communication standard.
            </p>
          </section>
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
