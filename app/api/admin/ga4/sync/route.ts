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
    
    // 🔍 调试：打印前10条原始数据
    console.log('🔍 [Debug] GA4 原始数据样本:');
    analytics.slice(0, 10).forEach((item, i) => {
      console.log(`  ${i + 1}. Path: "${item.pagePath}" | Views: ${item.pageViews}`);
    });

    let updatedCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    let notFoundCount = 0;
    const results: any[] = [];
    const skippedPaths: string[] = [];
    const notFoundSlugs: string[] = [];

    // 更新每篇文章的数据
    for (const item of analytics) {
      try {
        // 🔍 调试：打印处理的路径
        console.log(`🔍 处理路径: "${item.pagePath}"`);
        
        // 从路径提取 slug: /ask/slug.html -> slug
        // 处理可能的查询参数: /ask/slug.html?ref=google -> slug.html
        const cleanPath = item.pagePath.split('?')[0];
        const match = cleanPath.match(/\/ask\/(.+)$/);
        
        if (!match) {
          console.log(`  ⚠️ 路径不匹配，跳过: "${item.pagePath}"`);
          skippedCount++;
          skippedPaths.push(item.pagePath);
          continue;
        }

        const slug = match[1];
        console.log(`  ✅ 提取 slug: "${slug}"`);
        
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
          console.log(`  ✅ 更新成功: "${slug}"`);
        } else {
          console.log(`  ⚠️ 文章不存在于数据库: "${slug}"`);
          notFoundCount++;
          notFoundSlugs.push(slug);
        }
      } catch (err) {
        console.error(`❌ [Admin GA4 Sync] 更新失败: ${item.pagePath}`, err);
        errorCount++;
      }
    }

    // 获取高表现文章和推荐搜索词
    const highPerformers = await getHighPerformerPatterns();
    const topQueries = await getTopSearchQueries(5);

    console.log(`✅ [Admin GA4 Sync] 完成: ${updatedCount} 成功, ${notFoundCount} 不存在, ${errorCount} 失败, ${skippedCount} 跳过`);

    return NextResponse.json({
      success: true,
      message: `Synced ${updatedCount} articles`,
      errors: errorCount,
      skipped: skippedCount,
      notFound: notFoundCount,
      total: analytics.length,
      updated: results,
      // 🔍 调试信息
      debug: {
        skippedPaths: skippedPaths.slice(0, 20), // 前20个跳过的路径
        notFoundSlugs: notFoundSlugs.slice(0, 20), // 前20个不存在的slug
        rawDataSample: analytics.slice(0, 5).map(a => ({
          path: a.pagePath,
          views: a.pageViews,
        })),
      },
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
