'use client';

import dynamic from 'next/dynamic';

const AskAiWidget = dynamic(() => import('./AskAiWidget'), {
  ssr: false,
  loading: () => <div className="h-16 bg-gray-100 rounded-lg animate-pulse"></div>
});

interface Company {
  name: string;
  slug: string;
}

interface AskAiWidgetLazyProps {
  companies?: Company[];
  initialQuery?: string;
}

export default function AskAiWidgetLazy({ companies, initialQuery }: AskAiWidgetLazyProps) {
  return <AskAiWidget companies={companies} initialQuery={initialQuery} />;
}
