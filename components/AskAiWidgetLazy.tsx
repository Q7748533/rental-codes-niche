'use client';

import dynamic from 'next/dynamic';

const AskAiWidget = dynamic(() => import('./AskAiWidget'), {
  ssr: false,
  loading: () => <div className="h-16 bg-gray-100 rounded-lg animate-pulse"></div>
});

export default AskAiWidget;
