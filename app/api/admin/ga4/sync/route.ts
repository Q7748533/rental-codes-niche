import { NextResponse } from 'next/server';
import { getArticleAnalytics, testGA4Connection } from '@/lib/ga4';
import { updateArticleAnalytics, getHighPerformerPatterns, getTopSearchQueries } from '@/lib/learning';

// 测试 GA4 连接
export async function GET() {
  try {
    const result = await testGA4Connection();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// 手动触发同步
export async function POST() {
  try {
    console.log('🔄 [Admin GA4 Sync] 开始手动同步...');

    // 获取过去 7 天的文章数据
    const analytics = await getArticleAnalytics(7);
    console.log(`📊 [Admin GA4 Sync] 获取到 ${analytics.length} 条文章数据`);

    let updatedCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    const results: any[] = [];

    // 更新每篇文章的数据
    for (const item of analytics) {
      try {
        // 从路径提取 slug: /ask/slug.html -> slug
        const match = item.pagePath.match(/\/ask\/(.+)$/);
        if (!match) {
          skippedCount++;
          continue;
        }

        const slug = match[1];
        
        const updated = await updateArticleAnalytics(
          slug,
          item.pageViews,
          item.bounceRate,
          item.avgSessionDuration
        );
        
        if (updated) {
          updatedCount++;
          results.push({
            slug,
            pageViews: item.pageViews,
            bounceRate: item.bounceRate,
            isHighPerformer: updated.isHighPerformer,
          });
        } else {
          console.log(`⚠️ [Admin GA4 Sync] 文章不存在: ${slug}`);
          skippedCount++;
        }
      } catch (err) {
        console.error(`❌ [Admin GA4 Sync] 更新失败: ${item.pagePath}`, err);
        errorCount++;
      }
    }

    // 获取高表现文章和推荐搜索词
    const highPerformers = await getHighPerformerPatterns();
    const topQueries = await getTopSearchQueries(5);

    console.log(`✅ [Admin GA4 Sync] 完成: ${updatedCount} 成功, ${errorCount} 失败`);

    return NextResponse.json({
      success: true,
      message: `Synced ${updatedCount} articles`,
      errors: errorCount,
      skipped: skippedCount,
      total: analytics.length,
      updated: results,
      highPerformers: highPerformers.map(h => ({
        title: h.seoTitle,
        views: h.ga4PageViews,
      })),
      topQueries: topQueries.map(q => ({
        query: q.query,
        weight: q.weight,
        successCount: q.successCount,
      })),
    });
  } catch (error: any) {
    console.error('❌ [Admin GA4 Sync] 同步失败:', error);
    return NextResponse.json(
      { error: 'Sync failed', message: error.message },
      { status: 500 }
    );
  }
}
