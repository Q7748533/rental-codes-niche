import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// 获取 GA4 统计数据
export async function GET() {
  try {
    // 总文章数
    const totalArticles = await prisma.aiQuery.count();
    
    // 有流量的文章数
    const articlesWithTraffic = await prisma.aiQuery.count({
      where: { ga4PageViews: { gt: 0 } }
    });
    
    // 高表现文章数
    const highPerformerCount = await prisma.aiQuery.count({
      where: { isHighPerformer: true }
    });
    
    // 总浏览量
    const totalPageViews = await prisma.aiQuery.aggregate({
      _sum: { ga4PageViews: true }
    });
    
    // 平均跳出率（有数据的文章）
    const avgBounceRate = await prisma.aiQuery.aggregate({
      where: { ga4BounceRate: { not: null } },
      _avg: { ga4BounceRate: true }
    });
    
    // 最近更新的文章
    const recentArticles = await prisma.aiQuery.findMany({
      where: { ga4PageViews: { gt: 0 } },
      orderBy: { lastAnalyzed: 'desc' },
      take: 10,
      select: {
        slug: true,
        seoTitle: true,
        ga4PageViews: true,
        ga4BounceRate: true,
        ga4AvgDuration: true,
        isHighPerformer: true,
        lastAnalyzed: true,
      }
    });
    
    // 高表现文章
    const topArticles = await prisma.aiQuery.findMany({
      where: { isHighPerformer: true },
      orderBy: { ga4PageViews: 'desc' },
      take: 5,
      select: {
        slug: true,
        seoTitle: true,
        ga4PageViews: true,
        userPrompt: true,
      }
    });
    
    // 搜索词统计
    const searchQueryStats = await prisma.searchQuery.aggregate({
      _count: { id: true },
      _sum: { successCount: true, failCount: true }
    });
    
    // 高权重搜索词
    const topQueries = await prisma.searchQuery.findMany({
      orderBy: { weight: 'desc' },
      take: 5,
    });

    return NextResponse.json({
      success: true,
      overview: {
        totalArticles,
        articlesWithTraffic,
        highPerformerCount,
        totalPageViews: totalPageViews._sum.ga4PageViews || 0,
        avgBounceRate: avgBounceRate._avg.ga4BounceRate || 0,
      },
      recentArticles,
      topArticles,
      searchQueries: {
        total: searchQueryStats._count.id,
        totalSuccess: searchQueryStats._sum.successCount || 0,
        totalFail: searchQueryStats._sum.failCount || 0,
        topQueries,
      }
    });
  } catch (error: any) {
    console.error('❌ [GA4 Stats] 获取统计失败:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
