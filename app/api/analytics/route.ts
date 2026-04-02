// app/api/analytics/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';

// 简单的管理员检测（基于 cookie）
async function isAdminRequest(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const adminSession = cookieStore.get('admin_session');
    return adminSession?.value === 'true';
  } catch {
    return false;
  }
}

// GET - 获取 Analytics 配置（公开接口，用于前端注入）
export async function GET() {
  try {
    const config = await prisma.googleAnalyticsConfig.findFirst();
    
    if (!config || !config.isEnabled) {
      return NextResponse.json({ isEnabled: false });
    }

    // 检查是否排除管理员
    const isAdmin = await isAdminRequest();
    if (config.excludeAdmin && isAdmin) {
      return NextResponse.json({ isEnabled: false, reason: 'admin_excluded' });
    }

    return NextResponse.json({
      isEnabled: true,
      measurementId: config.measurementId,
      anonymizeIp: config.anonymizeIp,
    });
  } catch (error) {
    console.error('Get Analytics config error:', error);
    return NextResponse.json({ isEnabled: false });
  }
}
