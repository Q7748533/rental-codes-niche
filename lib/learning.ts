import { prisma } from './db';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.VECTOR_ENGINE_API_KEY || "YOUR_API_KEY_HERE",
  baseURL: "https://api.vectorengine.ai/v1"
});

// 学习配置
const LEARNING_CONFIG = {
  // 成功阈值：7天内超过这个浏览量算成功（低流量网站调低）
  SUCCESS_THRESHOLD: 3,
  // 高表现阈值：超过这个算高表现文章（低流量网站调低）
  HIGH_PERFORMER_THRESHOLD: 5,
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

  // 更新搜索词表现（如果有关联搜索词）
  if (article.searchQueryId) {
    const isSuccess = pageViews >= LEARNING_CONFIG.SUCCESS_THRESHOLD;
    const wasSuccess = article.ga4PageViews >= LEARNING_CONFIG.SUCCESS_THRESHOLD;
    
    // 情况1：首次评估（之前没有数据）
    // 情况2：从失败变为成功（之前<3，现在≥3）
    if (article.ga4PageViews === 0 || (!wasSuccess && isSuccess)) {
      await updateSearchQueryPerformance(
        article.searchQueryId,
        pageViews,
        bounceRate,
        isSuccess,
        article.ga4PageViews === 0 // 是否是首次评估
      );
    }
  }

  return updated;
}

// 更新搜索词表现
async function updateSearchQueryPerformance(
  searchQueryId: string,
  pageViews: number,
  bounceRate: number,
  isSuccess: boolean,
  isFirstEvaluation: boolean = true
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

  // 计算成功/失败计数变化
  let successIncrement = 0;
  let failIncrement = 0;
  
  if (isFirstEvaluation) {
    // 首次评估：直接根据结果计数
    successIncrement = isSuccess ? 1 : 0;
    failIncrement = isSuccess ? 0 : 1;
  } else {
    // 从失败变为成功：成功+1，失败-1
    successIncrement = 1;
    failIncrement = -1;
  }

  // 更新搜索词
  await prisma.searchQuery.update({
    where: { id: searchQueryId },
    data: {
      weight: newWeight,
      successCount: { increment: successIncrement },
      failCount: { increment: failIncrement },
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

// 🧠 模式学习：分析高表现文章特征，生成推荐搜索词
export async function learnFromHighPerformers() {
  // 1. 获取高表现文章
  const highPerformers = await prisma.aiQuery.findMany({
    where: {
      isHighPerformer: true,
    },
    select: {
      userPrompt: true,
      seoTitle: true,
      aiSummary: true,
      ga4PageViews: true,
      ga4BounceRate: true,
      ga4AvgDuration: true,
    },
    orderBy: {
      ga4PageViews: 'desc',
    },
    take: 5,
  });

  if (highPerformers.length === 0) {
    return {
      patterns: null,
      suggestions: [],
      message: '暂无高表现文章，无法学习模式',
    };
  }

  // 2. 提取特征模式（代码分析）
  const patterns = extractPatterns(highPerformers);

  // 3. 使用 AI 进行深度分析
  const aiAnalysis = await analyzeWithAI(highPerformers);

  // 4. 基于 AI 分析生成搜索词建议
  const suggestions = aiAnalysis?.suggestions || generateSearchSuggestions(patterns);

  return {
    patterns,
    aiAnalysis,
    suggestions,
    highPerformerCount: highPerformers.length,
  };
}

// 🤖 使用 AI 分析高表现文章
async function analyzeWithAI(articles: any[]) {
  try {
    const prompt = `
You are an SEO expert analyzing high-performing car rental articles.

Here are the top-performing articles:
${articles.map((a, i) => `
${i + 1}. Title: "${a.seoTitle}"
   Search Query: "${a.userPrompt}"
   Views: ${a.ga4PageViews}
   Bounce Rate: ${a.ga4BounceRate ? (a.ga4BounceRate * 100).toFixed(1) + '%' : 'N/A'}
`).join('\n')}

Analyze these articles and provide:
1. What makes these titles successful? (style, keywords, structure)
2. What user intents are being captured?
3. What content patterns work best?

Then generate 10 NEW search query suggestions that:
- Follow the successful patterns
- Target similar user intents
- Are natural and diverse
- Include location-specific and scenario-specific variations

Return JSON format:
{
  "titleAnalysis": "What makes titles successful...",
  "userIntentAnalysis": "What intents are captured...",
  "contentPatterns": "What content patterns work...",
  "suggestions": ["query 1", "query 2", ...]
}
`;

    const completion = await openai.chat.completions.create({
      model: "gemini-3.1-pro-preview",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const responseText = completion.choices[0].message.content || '{}';
    
    // 提取 JSON
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return null;
  } catch (error) {
    console.error('❌ AI analysis failed:', error);
    return null;
  }
}

// 提取高表现文章的特征模式
function extractPatterns(articles: any[]) {
  const patterns = {
    // 标题特征
    titlePatterns: {
      hasYear: articles.filter(a => /\b202[0-9]\b/.test(a.seoTitle)).length,
      hasVerified: articles.filter(a => /verified|active|best/i.test(a.seoTitle)).length,
      hasBrand: articles.filter(a => /hertz|avis|enterprise|alamo|national/i.test(a.seoTitle)).length,
      hasLocation: articles.filter(a => /lax|miami|chicago|california|florida/i.test(a.seoTitle)).length,
      avgLength: Math.round(articles.reduce((sum, a) => sum + a.seoTitle.length, 0) / articles.length),
    },
    // 内容特征
    contentPatterns: {
      avgWordCount: articles.map(a => a.aiSummary?.split(' ').length || 0),
    },
    // 搜索词特征
    queryPatterns: {
      commonWords: extractCommonWords(articles.map(a => a.userPrompt)),
      avgLength: Math.round(articles.reduce((sum, a) => sum + a.userPrompt.length, 0) / articles.length),
    },
    // 表现数据
    performance: {
      avgPageViews: Math.round(articles.reduce((sum, a) => sum + a.ga4PageViews, 0) / articles.length),
      avgBounceRate: articles.filter(a => a.ga4BounceRate).reduce((sum, a) => sum + (a.ga4BounceRate || 0), 0) / articles.filter(a => a.ga4BounceRate).length,
      avgDuration: Math.round(articles.filter(a => a.ga4AvgDuration).reduce((sum, a) => sum + (a.ga4AvgDuration || 0), 0) / articles.filter(a => a.ga4AvgDuration).length),
    },
  };

  return patterns;
}

// 提取常用词
function extractCommonWords(queries: string[]): string[] {
  const words = queries.join(' ').toLowerCase().split(/\s+/);
  const wordCount: Record<string, number> = {};
  
  words.forEach(word => {
    if (word.length > 3 && !['code', 'rental', 'car', 'with', 'for', 'the', 'and'].includes(word)) {
      wordCount[word] = (wordCount[word] || 0) + 1;
    }
  });

  return Object.entries(wordCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);
}

// 基于模式生成搜索词建议
function generateSearchSuggestions(patterns: any): string[] {
  const suggestions: string[] = [];
  const brands = ['Hertz', 'Avis', 'Enterprise', 'Alamo', 'National'];
  const locations = ['LAX', 'Miami', 'Chicago', 'NYC', 'Orlando', 'Las Vegas'];
  const scenarios = ['corporate', 'discount', 'promo', 'coupon', 'savings'];
  
  // 基于成功模式生成变体
  brands.forEach(brand => {
    scenarios.forEach(scenario => {
      suggestions.push(`${brand} ${scenario} code 2026`);
      suggestions.push(`best ${brand} ${scenario}`);
    });
    
    locations.forEach(location => {
      suggestions.push(`${brand} ${location} rental`);
      suggestions.push(`${brand} ${location} corporate code`);
    });
  });

  // 基于常用词扩展
  patterns.queryPatterns.commonWords.forEach((word: string) => {
    brands.forEach(brand => {
      suggestions.push(`${brand} ${word} code`);
    });
  });

  return [...new Set(suggestions)].slice(0, 20);
}

export { LEARNING_CONFIG };
