import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

/**
 * 验证管理员是否已登录
 * 未登录时返回 false，调用方自行处理跳转
 */
export async function verifyAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  const loggedIn = cookieStore.get('admin_logged_in');
  
  return !!(session && loggedIn);
}

/**
 * 验证管理员是否已登录，未登录则重定向到登录页
 */
export async function requireAdminAuth() {
  const isAuthenticated = await verifyAdminSession();
  
  if (!isAuthenticated) {
    redirect('/admin/login');
  }
}
