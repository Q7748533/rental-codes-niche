import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    // 测试数据库连接
    const articleCount = await prisma.aiQuery.count();
    
    // 获取一篇文章的详细信息
    const sampleArticle = await prisma.aiQuery.findFirst({
      select: {
        slug: true,
        seoTitle: true,
        ga4PageViews: true,
        isHighPerformer: true,
      }
    });
    
    return NextResponse.json({
      success: true,
      articleCount,
      sampleArticle,
      hasGa4Fields: sampleArticle ? 'ga4PageViews' in sampleArticle : false,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      code: error.code,
    }, { status: 500 });
  }
}
