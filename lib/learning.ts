import { prisma } from './db';

// 学习配置
const LEARNING_CONFIG = {
  // 成功阈值：7天内超过这个浏览量算成功
  SUCCESS_THRESHOLD: 10,
  // 高表现阈值：超过这个算高表现文章
  HIGH_PERFORMER_THRESHOLD: 100,
  // 权重调整系数
  SUCCESS_WEIGHT_MULTIPLIER: 1.1,
  FAILURE_WEIGHT_MULTIPLIER: 0.95,
  // 最大权重
  MAX_WEIGHT: 5.0,
  // 最小权重
  MIN_WEIGHT: 0.1,
};

// 更新文章分析数据
export async function updateArticleAnalytics(
  slug: string,
  pageViews: number,
  bounceRate: number,
  avgDuration: number
) {
  const article = await prisma.aiQuery.findUnique({
    where: { slug },
    include: { searchQuery: true },
  });

  if (!article) return null;

  // 判断是否高表现
  const isHighPerformer = pageViews >= LEARNING_CONFIG.HIGH_PERFORMER_THRESHOLD;

  // 更新文章数据
  const updated = await prisma.aiQuery.update({
    where: { slug },
    data: {
      ga4PageViews: pageViews,
      ga4BounceRate: bounceRate,
      ga4AvgDuration: Math.round(avgDuration),
      lastAnalyzed: new Date(),
      isHighPerformer,
    },
  });

  // 如果有关联搜索词，更新搜索词数据
  if (article.searchQueryId) {
    await updateSearchQueryPerformance(
      article.searchQueryId,
      pageViews,
      bounceRate,
      isHighPerformer
    );
  }

  return updated;
}

// 更新搜索词表现
async function updateSearchQueryPerformance(
  searchQueryId: string,
  pageViews: number,
  bounceRate: number,
  isSuccess: boolean
) {
  const searchQuery = await prisma.searchQuery.findUnique({
    where: { id: searchQueryId },
  });

  if (!searchQuery) return;

  // 计算新权重
  let newWeight = searchQuery.weight;
  
  if (isSuccess) {
    newWeight = Math.min(
      searchQuery.weight * LEARNING_CONFIG.SUCCESS_WEIGHT_MULTIPLIER,
      LEARNING_CONFIG.MAX_WEIGHT
    );
  } else {
    newWeight = Math.max(
      searchQuery.weight * LEARNING_CONFIG.FAILURE_WEIGHT_MULTIPLIER,
      LEARNING_CONFIG.MIN_WEIGHT
    );
  }

  // 更新搜索词
  await prisma.searchQuery.update({
    where: { id: searchQueryId },
    data: {
      weight: newWeight,
      successCount: isSuccess ? { increment: 1 } : searchQuery.successCount,
      failCount: !isSuccess ? { increment: 1 } : searchQuery.failCount,
      totalTraffic: { increment: pageViews },
      avgBounceRate: bounceRate,
    },
  });
}

// 获取高表现文章特征（用于 AI 学习）
export async function getHighPerformerPatterns() {
  const highPerformers = await prisma.aiQuery.findMany({
    where: {
      isHighPerformer: true,
    },
    select: {
      userPrompt: true,
      seoTitle: true,
      aiSummary: true,
      ga4PageViews: true,
    },
    orderBy: {
      ga4PageViews: 'desc',
    },
    take: 10,
  });

  return highPerformers;
}

// 获取待优化的低表现文章
export async function getLowPerformers() {
  const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  
  return prisma.aiQuery.findMany({
    where: {
      ga4PageViews: { lt: 5 },
      createdAt: { lt: twoWeeksAgo },
      isHighPerformer: false,
    },
    select: {
      slug: true,
      userPrompt: true,
      seoTitle: true,
      ga4PageViews: true,
    },
    take: 20,
  });
}

// 获取权重最高的搜索词（用于生成新文章）
export async function getTopSearchQueries(limit: number = 5) {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  return prisma.searchQuery.findMany({
    where: {
      isActive: true,
      OR: [
        { lastUsed: { lt: oneWeekAgo } },
        { lastUsed: null },
      ],
    },
    orderBy: {
      weight: 'desc',
    },
    take: limit,
  });
}

// 创建或更新搜索词
export async function upsertSearchQuery(query: string) {
  return prisma.searchQuery.upsert({
    where: { query },
    update: {},
    create: {
      query,
      weight: 1.0,
    },
  });
}

// 标记搜索词已使用
export async function markSearchQueryUsed(queryId: string) {
  return prisma.searchQuery.update({
    where: { id: queryId },
    data: {
      lastUsed: new Date(),
    },
  });
}

export { LEARNING_CONFIG };
