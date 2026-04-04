'use client';

import dynamic from 'next/dynamic';

const AskAiWidget = dynamic(() => import('./AskAiWidget'), {
  ssr: false,
  loading: () => <div className="h-16 bg-gray-100 rounded-lg animate-pulse"></div>
});

interface AskAiWidgetLazyProps {
  initialQuery?: string;
}

export default function AskAiWidgetLazy({ initialQuery }: AskAiWidgetLazyProps) {
  return <AskAiWidget initialQuery={initialQuery} />;
}
