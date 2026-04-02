import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';

// 验证管理员登录
async function verifyAdmin() {
  const cookieStore = await cookies();
  const adminSession = cookieStore.get('admin_session');
  return adminSession?.value === 'true';
}

// 获取 AdSense 配置
export async function GET() {
  try {
    if (!await verifyAdmin()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let config = await prisma.adSenseConfig.findFirst();
    
    // 如果没有配置，创建一个默认配置
    if (!config) {
      config = await prisma.adSenseConfig.create({
        data: {
          publisherId: 'ca-pub-5289849412154503',
          isEnabled: false,
          autoAdsEnabled: true,
        }
      });
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error('Get AdSense config error:', error);
    return NextResponse.json({ error: 'Failed to get config' }, { status: 500 });
  }
}

// 更新 AdSense 配置
export async function POST(req: Request) {
  try {
    if (!await verifyAdmin()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { publisherId, isEnabled, autoAdsEnabled } = body;

    let config = await prisma.adSenseConfig.findFirst();
    
    if (config) {
      // 更新现有配置
      config = await prisma.adSenseConfig.update({
        where: { id: config.id },
        data: {
          ...(publisherId !== undefined && { publisherId }),
          ...(isEnabled !== undefined && { isEnabled }),
          ...(autoAdsEnabled !== undefined && { autoAdsEnabled }),
        }
      });
    } else {
      // 创建新配置
      config = await prisma.adSenseConfig.create({
        data: {
          publisherId: publisherId || 'ca-pub-5289849412154503',
          isEnabled: isEnabled ?? false,
          autoAdsEnabled: autoAdsEnabled ?? true,
        }
      });
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error('Update AdSense config error:', error);
    return NextResponse.json({ error: 'Failed to update config' }, { status: 500 });
  }
}
