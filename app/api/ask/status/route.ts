// app/api/ask/status/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: Request) {
  // 🚀 强制禁用缓存：确保轮询拿到的是实时状态，而非边缘节点的旧数据
  const responseHeaders = {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  };

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400, headers: responseHeaders }
      );
    }

    const article = await prisma.aiQuery.findUnique({
      where: { id },
      select: {
        slug: true,
        seoTitle: true,
        aiSummary: true,
        createdAt: true, // 🚀 用于判断是否超时
      },
    });

    if (!article) {
      return NextResponse.json(
        { found: false, error: 'Task not found' },
        { status: 404, headers: responseHeaders }
      );
    }

    // 1. 成功态：生成完成
    if (article.slug) {
      return NextResponse.json({
        found: true,
        slug: article.slug.replace(/\.html$/, ''),
        title: article.seoTitle,
        summary: article.aiSummary,
      }, { headers: responseHeaders });
    }

    // 2. 失败态/超时检测：如果 3 分钟还没生成 slug，判定后台任务已死
    const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000);
    if (article.createdAt < threeMinutesAgo) {
      return NextResponse.json({
        found: false,
        error: 'Generation timeout',
        isFailed: true, // 🚀 告知前端停止轮询并报错
      }, { headers: responseHeaders });
    }

    // 3. 进行态：还在排队或生成中
    return NextResponse.json({ found: false }, { headers: responseHeaders });

  } catch (error) {
    console.error('Check status error:', error);
    return NextResponse.json(
      { found: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
