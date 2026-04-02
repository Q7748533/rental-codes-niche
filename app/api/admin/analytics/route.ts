// app/api/admin/analytics/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAdminSession } from '@/lib/auth';

// GET - 获取 Analytics 配置
export async function GET() {
  try {
    if (!await verifyAdminSession()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let config = await prisma.googleAnalyticsConfig.findFirst();
    
    if (!config) {
      config = await prisma.googleAnalyticsConfig.create({
        data: {
          measurementId: 'G-801N4HE033',
          isEnabled: false,
          anonymizeIp: true,
          excludeAdmin: true,
        }
      });
    }

    return NextResponse.json(config);
  } catch (error: any) {
    console.error('Get Analytics config error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch config',
      details: error?.message || String(error)
    }, { status: 500 });
  }
}

// POST - 更新 Analytics 配置
export async function POST(req: Request) {
  try {
    if (!await verifyAdminSession()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { measurementId, isEnabled, anonymizeIp, excludeAdmin } = body;

    let config = await prisma.googleAnalyticsConfig.findFirst();
    
    if (config) {
      config = await prisma.googleAnalyticsConfig.update({
        where: { id: config.id },
        data: {
          ...(measurementId !== undefined && { measurementId }),
          ...(isEnabled !== undefined && { isEnabled }),
          ...(anonymizeIp !== undefined && { anonymizeIp }),
          ...(excludeAdmin !== undefined && { excludeAdmin }),
        }
      });
    } else {
      config = await prisma.googleAnalyticsConfig.create({
        data: {
          measurementId: measurementId || 'G-801N4HE033',
          isEnabled: isEnabled ?? false,
          anonymizeIp: anonymizeIp ?? true,
          excludeAdmin: excludeAdmin ?? true,
        }
      });
    }

    return NextResponse.json(config);
  } catch (error: any) {
    console.error('Update Analytics config error:', error);
    return NextResponse.json({ 
      error: 'Failed to update config',
      details: error?.message || String(error)
    }, { status: 500 });
  }
}
