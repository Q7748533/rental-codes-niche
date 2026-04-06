'use client';

import dynamic from 'next/dynamic';

// Client Component 包装器，允许使用 ssr: false
const MobileNav = dynamic(() => import('./MobileNav'), {
  ssr: false,
});

export default function MobileNavClient() {
  return <MobileNav />;
}
