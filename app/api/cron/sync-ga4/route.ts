import { NextResponse } from 'next/server';
import { getArticleAnalytics } from '@/lib/ga4';
import { updateArticleAnalytics } from '@/lib/learning';

// Vercel Cron 调用此接口（每天凌晨 2 点）
export async function GET(request: Request) {
  try {
    // 验证 Cron 密钥（防止外部调用）
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔄 [GA4 Sync] 开始同步数据...');

    // 获取过去 7 天的文章数据
    const analytics = await getArticleAnalytics(7);
    console.log(`📊 [GA4 Sync] 获取到 ${analytics.length} 条文章数据`);

    let updatedCount = 0;
    let errorCount = 0;

    // 更新每篇文章的数据
    for (const item of analytics) {
      try {
        // 从路径提取 slug: /ask/slug.html -> slug
        const match = item.pagePath.match(/\/ask\/(.+?)\.html$/);
        if (!match) continue;

        const slug = match[1];
        
        await updateArticleAnalytics(
          slug,
          item.pageViews,
          item.bounceRate,
          item.avgSessionDuration
        );
        
        updatedCount++;
      } catch (err) {
        console.error(`❌ [GA4 Sync] 更新失败: ${item.pagePath}`, err);
        errorCount++;
      }
    }

    console.log(`✅ [GA4 Sync] 完成: ${updatedCount} 成功, ${errorCount} 失败`);

    return NextResponse.json({
      success: true,
      message: `Synced ${updatedCount} articles`,
      errors: errorCount,
      total: analytics.length,
    });
  } catch (error: any) {
    console.error('❌ [GA4 Sync] 同步失败:', error);
    return NextResponse.json(
      { error: 'Sync failed', message: error.message },
      { status: 500 }
    );
  }
}
