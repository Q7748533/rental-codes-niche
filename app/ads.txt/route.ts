import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

// 生成 ads.txt 文件内容
export async function GET(request: Request) {
  try {
    const config = await prisma.adSenseConfig.findFirst();
    
    if (!config || !config.isEnabled || !config.publisherId) {
      return new NextResponse('', { status: 404 });
    }

    // 使用完整的 publisher ID (保留 pub- 前缀)
    // AdSense 要求格式: google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0
    const publisherId = config.publisherId.replace('ca-', '');
    
    // ads.txt 标准格式
    const adsTxtContent = `google.com, ${publisherId}, DIRECT, f08c47fec0942fa0`;

    return new NextResponse(adsTxtContent, {
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Generate ads.txt error:', error);
    return new NextResponse('', { status: 500 });
  }
}
