import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = await cookies();
    
    // 清除登录相关的 cookies
    cookieStore.delete('admin_session');
    cookieStore.delete('admin_logged_in');
    
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: '登出失败' },
      { status: 500 }
    );
  }
}
