// app/api/ask/status/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id'); // 🚀 改用唯一的 ID 替代模糊查询

    if (!id) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    const article = await prisma.aiQuery.findUnique({
      where: { id }, // 🚀 精确匹配，杜绝冲突
      select: {
        slug: true,
        seoTitle: true,
        aiSummary: true,
      },
    });

    // 如果 slug 已经存在，说明 AI 生成并写入数据库已完成
    if (article?.slug) {
      return NextResponse.json({
        found: true,
        // 🚀 统一处理后缀，保证跳转不出现 404
        slug: article.slug.replace(/\.html$/, ''),
        title: article.seoTitle,
        summary: article.aiSummary,
      });
    }

    return NextResponse.json({ found: false });
  } catch (error) {
    console.error('Check status error:', error);
    return NextResponse.json({
      found: false,
      error: 'Failed to check status',
    }, { status: 500 });
  }
}
