import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// 获取所有启用的 meta 标签（公开接口，用于前端加载）
export async function GET() {
  try {
    const metaTags = await prisma.metaTag.findMany({
      where: { isEnabled: true },
      select: { name: true, content: true }
    });
    return NextResponse.json(metaTags);
  } catch (error) {
    console.error('Get meta tags error:', error);
    return NextResponse.json([]);
  }
}
