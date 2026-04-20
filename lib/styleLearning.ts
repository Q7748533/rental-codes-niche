import { prisma } from './db';

// 🎨 写作风格定义
interface WritingStyle {
  id: string;
  name: string;
  sceneType: SceneType;
  titleFormula: string;
  contentStructure: string[];
  toneDescription: string;
  weight: number;
  successCount: number;
  failCount: number;
}

// 🎯 场景类型
type SceneType = 
  | 'price_sensitive'    // 价格敏感
  | 'location_specific'  // 地点特定
  | 'audience_specific'  // 人群特定
  | 'service_need'       // 服务需求
  | 'urgent'            // 紧急需求
  | 'brand_loyal';      // 品牌忠诚

// 场景关键词映射
const SCENE_KEYWORDS: Record<SceneType, string[]> = {
  price_sensitive: ['cheap', 'save', 'discount', '%', 'deal', 'offer', 'lowest', 'best price'],
  location_specific: ['lax', 'miami', 'nyc', 'airport', 'chicago', 'orlando', 'vegas', 'california', 'florida'],
  audience_specific: ['under 25', 'student', 'corporate', 'employee', 'member', 'aaa', 'ibm'],
  service_need: ['insurance', 'one-way', 'unlimited', 'mileage', 'ldw', 'cdw', 'coverage'],
  urgent: ['last minute', 'sold out', 'today', 'tomorrow', 'asap', 'urgent', 'quick'],
  brand_loyal: ['hertz vs', 'avis vs', 'enterprise vs', 'better than', 'compare'],
};

// 默认风格库
const DEFAULT_STYLES: Omit<WritingStyle, 'id' | 'successCount' | 'failCount'>[] = [
  // 价格敏感 - 直接型
  {
    name: 'price_direct',
    sceneType: 'price_sensitive',
    titleFormula: 'Save [X]% on [Brand] Rentals with [Code Type]',
    contentStructure: ['hook_savings', 'code_list', 'how_to_use', 'real_savings_example', 'faq'],
    toneDescription: 'Direct, numbers-focused, no fluff',
    weight: 1.2,
  },
  // 价格敏感 - 故事型
  {
    name: 'price_story',
    sceneType: 'price_sensitive',
    titleFormula: 'How I Saved $[Amount] on [Brand] [Location] Rentals',
    contentStructure: ['personal_story', 'problem', 'solution', 'step_by_step', 'final_tip'],
    toneDescription: 'Personal, relatable, first-person narrative',
    weight: 1.5,
  },
  // 价格敏感 - 对比型
  {
    name: 'price_compare',
    sceneType: 'price_sensitive',
    titleFormula: '[Brand] vs [Competitor]: Which [Code Type] Saves More?',
    contentStructure: ['comparison_hook', 'side_by_side', 'winner_declared', 'how_to_book', 'pro_tips'],
    toneDescription: 'Analytical, objective, data-driven',
    weight: 1.0,
  },
  // 地点特定 - 指南型
  {
    name: 'location_guide',
    sceneType: 'location_specific',
    titleFormula: 'The Complete [Location] [Brand] Rental Guide [Year]',
    contentStructure: ['location_intro', 'airport_tips', 'code_application', 'local_insider', 'avoid_mistakes'],
    toneDescription: 'Authoritative, local expert, insider knowledge',
    weight: 1.3,
  },
  // 地点特定 - 场景型
  {
    name: 'location_scenario',
    sceneType: 'location_specific',
    titleFormula: '[Scenario] at [Location]: Best [Brand] Codes for [Situation]',
    contentStructure: ['scenario_setup', 'challenge', 'solution_codes', 'step_guide', 'real_test'],
    toneDescription: 'Scenario-based, problem-solution, practical',
    weight: 1.1,
  },
  // 人群特定 - 专属型
  {
    name: 'audience_exclusive',
    sceneType: 'audience_specific',
    titleFormula: '[Audience] Exclusive: [Brand] [Benefit] Codes That Actually Work',
    contentStructure: ['audience_callout', 'eligibility', 'exclusive_codes', 'id_requirements', 'maximize_savings'],
    toneDescription: 'Exclusive, insider, membership-focused',
    weight: 1.4,
  },
  // 服务需求 - 解决型
  {
    name: 'service_solution',
    sceneType: 'service_need',
    titleFormula: 'How to Get [Service] with [Brand] Codes (Avoid $[Amount] Fees)',
    contentStructure: ['fee_warning', 'code_solution', 'booking_process', 'counter_strategy', 'confirmation'],
    toneDescription: 'Problem-aware, solution-focused, warning-then-relief',
    weight: 1.2,
  },
  // 紧急需求 - 快速型
  {
    name: 'urgent_quick',
    sceneType: 'urgent',
    titleFormula: 'Last-Minute [Brand] [Location]: Codes That Work in [Timeframe]',
    contentStructure: ['urgency_hook', 'instant_codes', '5min_booking', 'guarantee', 'backup_plan'],
    toneDescription: 'Urgent, fast, immediate action, no fluff',
    weight: 1.0,
  },
  // 品牌忠诚 - 评测型
  {
    name: 'brand_review',
    sceneType: 'brand_loyal',
    titleFormula: '[Brand] vs [Competitor] [Year]: Which Corporate Code Wins?',
    contentStructure: ['comparison_intro', 'code_battle', 'price_test', 'service_compare', 'verdict'],
    toneDescription: 'Comparative, balanced, test-based',
    weight: 1.1,
  },
];

// 🎯 检测用户搜索的场景类型
export function detectSceneType(query: string): SceneType {
  const queryLower = query.toLowerCase();
  
  const sceneScores: Record<SceneType, number> = {
    price_sensitive: 0,
    location_specific: 0,
    audience_specific: 0,
    service_need: 0,
    urgent: 0,
    brand_loyal: 0,
  };
  
  // 计算每个场景的匹配度
  (Object.keys(SCENE_KEYWORDS) as SceneType[]).forEach(scene => {
    SCENE_KEYWORDS[scene].forEach(keyword => {
      if (queryLower.includes(keyword)) {
        sceneScores[scene]++;
      }
    });
  });
  
  // 返回得分最高的场景
  const sortedScenes = (Object.keys(sceneScores) as SceneType[])
    .sort((a, b) => sceneScores[b] - sceneScores[a]);
  
  return sceneScores[sortedScenes[0]] > 0 ? sortedScenes[0] : 'price_sensitive';
}

// 🎲 加权随机选择风格
export function selectStyleByWeight(styles: WritingStyle[]): WritingStyle {
  const totalWeight = styles.reduce((sum, s) => sum + s.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const style of styles) {
    random -= style.weight;
    if (random <= 0) {
      return style;
    }
  }
  
  return styles[styles.length - 1];
}

// 🧠 获取适合当前场景的风格
export async function getStyleForQuery(query: string): Promise<WritingStyle> {
  const sceneType = detectSceneType(query);
  
  // 从数据库获取该场景的风格
  let styles = await prisma.writingStyle.findMany({
    where: { sceneType },
  });
  
  // 如果数据库没有，使用默认风格
  if (styles.length === 0) {
    const defaultSceneStyles = DEFAULT_STYLES.filter(s => s.sceneType === sceneType);
    
    // 创建默认风格到数据库
    for (const style of defaultSceneStyles) {
      await prisma.writingStyle.create({
        data: {
          ...style,
          successCount: 0,
          failCount: 0,
        },
      });
    }
    
    styles = await prisma.writingStyle.findMany({
      where: { sceneType },
    });
  }
  
  // 20% 概率尝试权重较低的风格（探索）
  if (Math.random() < 0.2 && styles.length > 1) {
    // 选择权重最低的风格进行探索
    return styles.sort((a, b) => a.weight - b.weight)[0];
  }
  
  // 80% 概率按权重选择
  return selectStyleByWeight(styles);
}

// 📊 根据文章表现更新风格权重
export async function updateStylePerformance(
  styleId: string,
  pageViews: number,
  isSuccess: boolean
) {
  const style = await prisma.writingStyle.findUnique({
    where: { id: styleId },
  });
  
  if (!style) return;
  
  // 计算新权重
  let newWeight = style.weight;
  
  if (isSuccess) {
    newWeight = Math.min(style.weight * 1.1, 2.0); // 最大权重 2.0
  } else {
    newWeight = Math.max(style.weight * 0.95, 0.5); // 最小权重 0.5
  }
  
  await prisma.writingStyle.update({
    where: { id: styleId },
    data: {
      weight: newWeight,
      successCount: isSuccess ? { increment: 1 } : style.successCount,
      failCount: !isSuccess ? { increment: 1 } : style.failCount,
    },
  });
}

// 📝 构建风格提示词
export function buildStylePrompt(style: WritingStyle): string {
  return `
[WRITING STYLE GUIDE - FOLLOW STRICTLY]:
Style Name: ${style.name}
Scene Type: ${style.sceneType}

Title Formula: ${style.titleFormula}
Example Titles:
- "Save 25% on Hertz Rentals with CDP Codes"
- "How I Saved $200 on Avis Miami Rentals"
- "Hertz vs Enterprise: Which Corporate Code Wins?"

Content Structure (Follow this order):
${style.contentStructure.map((section, i) => `${i + 1}. ${section}`).join('\n')}

Tone & Voice: ${style.toneDescription}

CRITICAL: Use this structure but INVENT fresh content. Do NOT copy phrases from examples.
`;
}

export { SceneType, WritingStyle };
