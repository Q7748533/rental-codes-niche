import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// 获取 AdSense 配置（公开接口，用于前端加载广告）
export async function GET() {
  try {
    const config = await prisma.adSenseConfig.findFirst();
    
    if (!config || !config.isEnabled) {
      return NextResponse.json({ enabled: false });
    }

    return NextResponse.json({
      enabled: true,
      publisherId: config.publisherId,
      autoAdsEnabled: config.autoAdsEnabled,
    });
  } catch (error) {
    console.error('Get AdSense config error:', error);
    return NextResponse.json({ enabled: false });
  }
}
