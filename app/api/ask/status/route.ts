// app/api/ask/status/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: Request) {
  const responseHeaders = {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  };

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400, headers: responseHeaders });
    }

    // 🚀 新增：把 seoContent 也查出来，作为判断是否真完成的终极依据
    const article = await prisma.aiQuery.findUnique({
      where: { id },
      select: {
        slug: true,
        seoTitle: true,
        aiSummary: true,
        seoContent: true, // <-- 必须查这个
        createdAt: true,
      },
    });

    if (!article) {
      return NextResponse.json({ found: false, error: 'Task not found' }, { status: 404, headers: responseHeaders });
    }

    // ==========================================
    // 🎯 核心修复：严谨的"完成态"判定
    // 必须满足：1. 有 slug  2. slug 不是占位符  3. 正文 seoContent 真的有东西
    // ==========================================
    const isActuallyCompleted =
      article.slug &&
      !article.slug.startsWith('pending-') &&
      article.seoContent &&
      article.seoContent.length > 50;

    if (isActuallyCompleted) {
      return NextResponse.json({
        found: true,
        slug: article.slug.replace(/\.html$/, ''),
        title: article.seoTitle,
        summary: article.aiSummary,
      }, { headers: responseHeaders });
    }

    // 2. 失败态/超时检测：如果 3 分钟还没生成完，判定后台任务已死
    const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000);
    if (article.createdAt < threeMinutesAgo) {
      return NextResponse.json({
        found: false,
        error: 'Generation timeout or failed in background.',
        isFailed: true,
      }, { headers: responseHeaders });
    }

    // 3. 进行态：还在排队或生成中（返回 false，让前端继续耐心轮询）
    return NextResponse.json({ found: false }, { headers: responseHeaders });

  } catch (error) {
    console.error('Check status error:', error);
    return NextResponse.json({ found: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
