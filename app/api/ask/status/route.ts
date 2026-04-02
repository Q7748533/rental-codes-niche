// app/api/ask/status/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query');

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // 查询最近 5 分钟内创建的、包含该查询词的文章
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const article = await prisma.aiQuery.findFirst({
      where: {
        userPrompt: {
          contains: query,
          mode: 'insensitive',
        },
        createdAt: {
          gte: fiveMinutesAgo,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        slug: true,
        seoTitle: true,
        aiSummary: true,
      },
    });

    if (article) {
      return NextResponse.json({
        found: true,
        slug: article.slug,
        title: article.seoTitle,
        summary: article.aiSummary,
      });
    }

    return NextResponse.json({
      found: false,
    });
  } catch (error) {
    console.error('Check status error:', error);
    return NextResponse.json({
      found: false,
      error: 'Failed to check status',
    }, { status: 500 });
  }
}
