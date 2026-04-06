'use client';

import dynamic from 'next/dynamic';

// Client Component 包装器，允许使用 ssr: false
const MobileNav = dynamic(() => import('./MobileNav'), {
  ssr: false,
  loading: () => (
    // 🚀 修复CLS：固定尺寸占位符，避免加载后跳动
    <div className="md:hidden w-10 h-10"></div>
  ),
});

export default function MobileNavClient() {
  return <MobileNav />;
}
