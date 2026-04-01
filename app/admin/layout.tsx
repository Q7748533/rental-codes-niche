import Link from 'next/link';
import { requireAdminAuth } from '@/lib/auth';
import LogoutButton from './components/LogoutButton';

export const dynamic = 'force-dynamic';

const menuItems = [
  { href: '/admin', label: '概览', icon: '📊' },
  { href: '/admin/deals', label: '首页优惠链接', icon: '🔗' },
  { href: '/admin/brands', label: '品牌管理', icon: '🏢' },
  { href: '/admin/import', label: '导入代码', icon: '📥' },
  { href: '/admin/codes', label: '代码管理', icon: '🎫' },
  { href: '/admin/ai-articles', label: 'AI 文章管理', icon: '🤖' },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 验证管理员登录
  await requireAdminAuth();

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* 左侧导航 */}
      <aside className="w-64 bg-gray-900 text-white flex-shrink-0">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-xl font-bold">管理后台</h1>
          <p className="text-xs text-gray-400 mt-1">Car Corporate Codes</p>
        </div>

        <nav className="p-4 space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
            >
              <span>{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 w-64 p-4 border-t border-gray-800">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="text-gray-400 hover:text-white text-sm transition-colors"
            >
              ← 返回前台
            </Link>
            <LogoutButton />
          </div>
        </div>
      </aside>

      {/* 右侧内容区 */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
