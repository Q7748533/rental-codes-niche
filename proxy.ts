import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  // 检查是否为管理员
  const adminSession = request.cookies.get('admin_session')?.value;
  const isAdmin = adminSession === 'true';

  // 创建响应
  const response = NextResponse.next();

  // 将管理员状态添加到请求头，供 Layout 使用
  response.headers.set('x-is-admin', isAdmin ? 'true' : 'false');

  return response;
}

export const config = {
  matcher: [
    // 匹配所有路径，除了静态文件和 API
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
};
