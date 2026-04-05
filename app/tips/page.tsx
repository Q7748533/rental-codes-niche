import type { Metadata } from 'next';
import Link from 'next/link';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'Car Rental Tips & Guides | Car Corporate Codes',
  description: 'Expert tips on using corporate codes, maximizing savings, and avoiding common car rental pitfalls.',
  openGraph: {
    title: 'Car Rental Tips & Guides | Car Corporate Codes',
    description: 'Expert tips on using corporate codes, maximizing savings, and avoiding common car rental pitfalls.',
    type: 'article',
    url: 'https://carcorporatecodes.com/tips',
    siteName: 'Car Corporate Codes',
  },
  twitter: {
    card: 'summary',
    title: 'Car Rental Tips & Guides | Car Corporate Codes',
    description: 'Expert tips on using corporate codes and maximizing savings.',
  },
  alternates: {
    canonical: 'https://carcorporatecodes.com/tips',
  },
};

export default function TipsPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Car Rental Tips & Guides',
    description: 'Expert tips on using corporate codes, maximizing savings, and avoiding common car rental pitfalls.',
    url: 'https://carcorporatecodes.com/tips',
    isPartOf: {
      '@id': 'https://carcorporatecodes.com/#website',
    },
    author: {
      '@type': 'Organization',
      name: 'Car Corporate Codes',
    },
    datePublished: '2026-01-01',
    dateModified: '2026-01-01',
  };

  const tips = [
    {
      title: 'Always Book Directly',
      content: 'Book directly on the rental company\'s website, not through third-party sites like Expedia or Kayak. Third-party bookings often have hidden fees and may not honor corporate rates or loyalty benefits.',
      icon: '✓',
    },
    {
      title: 'Check ID Requirements',
      content: 'Before using a corporate code, verify what documentation is required. Some codes need a business card, employee ID, or proof of membership. Being prepared saves time at the counter.',
      icon: '🆔',
    },
    {
      title: 'Compare Multiple Codes',
      content: 'Don\'t settle for the first code you find. Try several corporate and association codes to find the best rate. Sometimes public promotions beat corporate rates.',
      icon: '💰',
    },
    {
      title: 'Book Early for Airport Locations',
      content: 'Airport rental locations have limited inventory and higher demand. Book at least 2-3 weeks in advance for the best selection and rates, especially during peak travel seasons.',
      icon: '✈️',
    },
    {
      title: 'Avoid Prepaid Fuel',
      content: 'Decline the prepaid fuel option. It\'s almost always cheaper to fill up yourself before returning the car. Just leave enough time to find a gas station near the return location.',
      icon: '⛽',
    },
    {
      title: 'Check for Hidden Fees',
      content: 'Watch out for additional driver fees, young driver surcharges, and equipment rentals (GPS, car seats). These can add $10-30 per day to your rental cost.',
      icon: '⚠️',
    },
    {
      title: 'Use Loyalty Programs',
      content: 'Join rental company loyalty programs (free to join) for perks like skip-the-counter service, free upgrades, and earning points toward free rentals. Corporate rates still earn loyalty points.',
      icon: '⭐',
    },
    {
      title: 'Inspect Before Driving',
      content: 'Always inspect the car for damage before leaving the lot. Take photos of any scratches, dents, or interior issues. Report them immediately to avoid being charged for pre-existing damage.',
      icon: '📸',
    },
    {
      title: 'Consider Off-Airport Locations',
      content: 'Off-airport locations often have lower base rates and fewer fees. The savings can be worth the short taxi or rideshare trip, especially for longer rentals.',
      icon: '🏢',
    },
    {
      title: 'Check Your Insurance Coverage',
      content: 'Before buying rental insurance, check if your personal auto insurance or credit card covers rental cars. Many premium credit cards include primary rental coverage.',
      icon: '🛡️',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Script
        id="json-ld-tips"
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

      <main className="max-w-3xl mx-auto px-4 py-12" role="main" aria-label="Car rental tips and guides">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Car Rental Tips & Guides</h1>
        <p className="text-gray-600 mb-8">
          Expert advice to help you save money and avoid common pitfalls when renting a car.
        </p>
        
        <div className="space-y-4">
          {tips.map((tip, index) => (
            <article 
              key={index}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <span className="text-2xl flex-shrink-0">{tip.icon}</span>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">{tip.title}</h2>
                  <p className="text-gray-600 leading-relaxed">{tip.content}</p>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-12 bg-blue-50 rounded-xl p-6 border border-blue-100">
          <h2 className="text-xl font-semibold text-blue-900 mb-3">Need a Specific Code?</h2>
          <p className="text-blue-800 mb-4">
            Use our AI assistant to find the best corporate codes for your company or travel situation.
          </p>
          <Link 
            href="/"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Ask AI Rental Code Finder
          </Link>
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
