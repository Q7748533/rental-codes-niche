// app/api/ask/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateUniqueSlug } from '@/lib/slugify';
import OpenAI from 'openai';
import { revalidatePath } from 'next/cache';

const openai = new OpenAI({
  apiKey: process.env.VECTOR_ENGINE_API_KEY || "在这里填入你的真实 API KEY", 
  baseURL: "https://api.vectorengine.ai/v1"
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { query } = body;

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // ==========================================
    // 🎯 核心修复 1：精准捕获年份意图 & 锁定时间线
    // ==========================================
    const now = new Date();
    const currentYear = now.getFullYear();
    
    // 尝试从用户的 query 中提取四位数的年份 (例如 "2024", "2025", "2026")
    const queryYearMatch = query.match(/\b(202[4-9])\b/); 
    
    // 【优化】：如果用户没写年份，强制使用当前真实年份，彻底杜绝 2024/2025 的时空穿越！
    const targetYear = queryYearMatch ? queryYearMatch[1] : currentYear.toString();

    // 【优化】：动态计算上个月的月份和年份，用于注入极其逼真的 EEAT 测试数据
    const lastMonthDate = new Date();
    lastMonthDate.setMonth(now.getMonth() - 1);
    const testMonthContext = lastMonthDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });

    // ==========================================
    // 🚗 核心修复 2：动态品牌雷达 (实时同步数据库)
    // ==========================================
    // 瞬间拉取你数据库中所有存在的品牌名称
    const dbBrands = await prisma.brand.findMany({
      select: { name: true }
    });
    
    // 转换成全小写的数组，例如: ['hertz', 'avis', 'fox', 'europcar']
    const dynamicBrands = dbBrands.map(b => b.name.toLowerCase());
    const queryLower = query.toLowerCase();
    
    // 嗅探用户查询中是否包含了你数据库里【真实存在】的品牌
    const detectedBrand = dynamicBrands.find(brand => queryLower.includes(brand));

    // ==========================================
    // 🛡️ 基础护城河：从数据库抓取真实数据，终结 AI 幻觉
    // ==========================================
    const words = query.split(/[^a-zA-Z0-9]/).filter((w: string) => w.length > 2);
    // 如果雷达扫到了品牌，就用品牌名；否则退回到找第一个有意义的词
    const searchKeyword = detectedBrand || (words.length > 0 ? words[0] : '');
    const lowerKeyword = searchKeyword.toLowerCase();

    // 优先尝试匹配用户搜索的品牌、组织名或描述
    let realCodesData = await prisma.code.findMany({
      where: {
        OR: [
          { brand: { name: { contains: lowerKeyword } } },
          { company: { name: { contains: lowerKeyword } } },
          { description: { contains: lowerKeyword } }
        ]
      },
      take: 5,
      orderBy: { createdAt: 'desc' }, 
      include: { brand: true, company: true }
    });

    // Fallback 机制：如果用户的 query 极其冷门，没匹配到任何数据，抓取最新高价值代码兜底
    if (realCodesData.length === 0) {
      realCodesData = await prisma.code.findMany({
        take: 3,
        orderBy: { createdAt: 'desc' }, 
        include: { brand: true, company: true }
      });
    }

    const realCodesContext = realCodesData.length > 0 
      ? realCodesData.map(c => `- 品牌: ${c.brand.name} | 组织: ${c.company.name} | 代码: ${c.codeValue} | 类型: ${c.codeType || 'N/A'} | 描述: ${c.description || '无'}`).join('\n')
      : "暂无具体的数据库代码，请给出通用的安全租车建议，切勿编造数字。";

    // ==========================================
    // 🧠 策略三 (LSI 注入)：建立行业语义实体库
    // ==========================================
    const lsiVocabulary = [
      "walk-up rate", "liability coverage", "counter bypass", "underage fee waiver", 
      "blackout dates", "dynamic pricing", "airport concession fee", "base rate", 
      "fleet availability", "premium upgrade", "drop-off charge", "loyalty tier status"
    ];
    // 随机抽取 3 个 LSI 词汇强制注入
    const selectedLSI = lsiVocabulary.sort(() => 0.5 - Math.random()).slice(0, 3).join(", ");

    // 随机场景与语气
    const scenarios = [
      "A stressful family vacation to Disney World in Orlando (MCO)",
      "A last-minute tech conference at McCormick Place in Chicago (ORD)",
      "A winter ski trip flying into Denver International (DEN)",
      "A scenic Pacific Coast Highway road trip starting at SFO"
    ];
    const randomScenario = scenarios[Math.floor(Math.random() * scenarios.length)];

    // ==========================================
    // 🚀 第一阶段：撰稿人智能体 (Agent A - Writer / Gemini)
    // ==========================================
    const writerPrompt = `
你是一个资深的美国差旅达人。你需要根据我提供的【真实数据库代码】，写一篇高转化率的实战经验分享。

【真实代码数据 - 严禁伪造】：
${realCodesContext}
(如果你必须提及具体的数字代码，只能从上方列表中选取，用对品牌术语如 Hertz CDP, Avis AWD。)

【写作设定】：
年份：${targetYear}
强制语义注入 (LSI Keywords)：你必须在文章中自然地使用以下 3 个专业术语：[${selectedLSI}]。

🚨 【写作细节强化指令（必须包含以下3点）】：
1. 官网操作指南：在推荐代码时，用一两句话顺带提一下该租车公司官网的具体操作细节（例如：Hertz 的 "Pay Later" 选项、Enterprise 的下拉菜单、Avis 的 AWD 输入框位置等），增强实操感。
2. 柜台查验严厉度：以老司机的口吻，评价一下该地点（如 [场景中的城市或机场]）柜台检查工牌/ID 的严格程度。
3. 积分与会员权益：明确告诉用户，使用这些推荐代码依然可以正常累积租车公司的忠诚度积分（如 Hertz Gold Plus Rewards, Avis Preferred 等）或享受免排队通道。

🚨 【动态意图嗅探指令】：
用户的原始搜索词是："${query}"。
1. 🎯 专家避坑转折：如果搜索词中指定了具体的租车品牌或公司（如 IBM），但提供的【真实代码数据】里碰巧没有，【绝对不要】说"我的数据库里没有"。你必须像个老司机一样这样转场："官方的 [搜索词] 内部代码现在查工牌极其严格，在柜台极易被反薅。为了安全起见，我强烈建议你使用以下几个同样给力、且免查 ID 的平替神码："
2. 📍 地点嗅探：如果搜索词中包含了任何具体的城市名、州名或机场代码（例如 LAX, Miami, Hawaii, NYC 等），你**必须**以该地点作为你实战经验的背景！
3. 🎲 备用场景：如果搜索词中没有提到地点，请使用这个随机场景作为背景：${randomScenario}。

【🛡️ 策略四 (EEAT 信任模块)：强制生成测试记录】
你必须在文章末尾生成一个专属的 "How I Tested This" 模块。使用 HTML 的 <div style="background-color: #f8fafc; padding: 20px; border-left: 4px solid #3b82f6; margin-top: 30px; border-radius: 0 8px 8px 0;"> 标签包裹。
模块内必须包含虚构但极其逼真的测试数据：Test Date: ${testMonthContext} (必须严格使用这个日期！)、Location (必须严格符合上方决定的场景或地点！)、Original Price (如 $450)、Price with Code (如 $315)、Total Saved。

【标题生成策略 - 避免模板化】
你必须生成一个独特、有吸引力的标题，严禁使用 "Save X% Off" 这种常见模板。

根据用户搜索意图，从以下角度中选择最合适的一个来构建标题：
1. 🎯 特定人群角度："IBM Employees", "AAA Members", "Government Workers", "Students"
2. 🌍 特定场景角度："Airport Pickup", "One-Way Rental", "Long-Term Lease", "Last-Minute Booking"
3. 💎 独特卖点角度："Free Upgrade", "Waived Young Driver Fee", "Unlimited Miles", "No Cancellation Fee"
4. ❓ 疑问式角度："How to Get...", "Which Code is Best for...", "What's the Cheapest Way to..."
5. 📍 地点聚焦角度："in Los Angeles", "at LAX", "for NYC Business Travel"
6. 🔥 紧迫感角度："Limited Time", "This Month Only", "Before Rates Go Up"

标题公式（选择一种，不要混用）：
- [品牌] + [人群/场景] + [年份] + [独特卖点]
- How I Saved [金额] on [品牌] Rentals ([年份])
- The [形容词] Guide to [品牌] [代码类型] Codes
- [疑问词] [品牌] [场景] [年份]?

【输出要求】
请严格返回 JSON 格式：
{
  "isValid": true,
  "summary": "给用户的简短回复（2句话）。指出文中最好的一个真实代码。",
  "seoTitle": "独特、非模板化的 SEO 标题（60字符以内）。避免'Save X% Off'格式。必须包含年份${targetYear}。如果用户搜索词包含地点，必须把地点加在标题里。",
  "seoContent": "包含 HTML 标签的 300-400 字内文。必须包含 <h2>, <p>, <ul> 以及上文要求的 EEAT 浅色背景信任模块。"
}
`;

    console.log("🤖 启动编辑部模式... [撰稿人 Gemini] 正在疯狂码字...");
    const draftCompletion = await openai.chat.completions.create({
      model: "gemini-3.1-pro-preview", 
      messages: [
        { role: "system", content: writerPrompt },
        { role: "user", content: query }
      ],
      temperature: 0.8, 
      response_format: { type: "json_object" } 
    });

    const draftResponseText = draftCompletion.choices[0].message.content || '{}';
    let draftData;
    try {
      draftData = JSON.parse(draftResponseText.match(/\{[\s\S]*\}/)?.[0] || draftResponseText);
    } catch (e) {
      throw new Error('Writer Agent failed to output valid JSON.');
    }

    if (!draftData.isValid) {
      return NextResponse.json({ summary: draftData.summary || "No valid codes found.", slug: "" });
    }

    // ==========================================
    // 🔪 第二阶段：主编智能体 (Agent B - Editor / Claude)
    // ==========================================
    const editorPrompt = `
[ROLE: Cynical SEO Editor | ton=cynical,direct,anti-corporate | lang=en]
[INPUT: draft_html]
[VARS: LSI_TERMS=[${selectedLSI}]]

=== WORKFLOW ===
[STEP1: SCAN|tgt=AI-fluff]=>[DEL: "As an experienced...", "In conclusion", "Fortunately,"]
[STEP2: SCAN|tgt=cliches]=>[BAN: "Real talk", "Look:", "Here's the deal", "Game-changer"]
[STEP3: REWRITE|ton=cynical|sty=short-sentences,reddit-rant]
[STEP4: CHECK|tgt=LSI_TERMS|action=ensure-exist]
[STEP5: EXTRACT|tgt=<div style="background-color: #f8fafc...">]=>[SHIELD: HTML+CSS|allow-modify=false]
[STEP6: FMT|tgt=tags]=>[FIX: broken-html]

=== BEHAVIOR ===
[OUTPUT: direct | fmt=json]
[ESCAPE: false | allow-markdown=false]

{
  "editedHtml": "[RAW_HTML_ONLY]"
}
`;

    console.log("🔪 初稿完成。[毒舌主编 Claude] 正在进行去 AI 化洗稿...");
    const editorCompletion = await openai.chat.completions.create({
      model: "claude-opus-4-6", 
      messages: [
        { role: "system", content: editorPrompt },
        { role: "user", content: `【初稿 HTML】：\n${draftData.seoContent}` }
      ],
      temperature: 0.4, 
      response_format: { type: "json_object" } 
    });

    const editorResponseText = editorCompletion.choices[0].message.content || '{}';
    let finalHtmlContent = draftData.seoContent; // 默认 fallback，如果 Claude 崩溃则用 Gemini 的初稿
    try {
      const editorData = JSON.parse(editorResponseText.match(/\{[\s\S]*\}/)?.[0] || editorResponseText);
      if (editorData.editedHtml) finalHtmlContent = editorData.editedHtml;
    } catch (e) {
      console.warn('Editor Agent failed, falling back to Draft HTML.');
    }

    // ==========================================
    // 💾 最终阶段：生成 URL 并存入数据库
    // ==========================================
    const finalSlug = await generateUniqueSlug(prisma, draftData.seoTitle || query, 60);

    // 🚀 先创建记录（无 slug），返回 taskId 给前端开始轮询
    const savedQuery = await prisma.aiQuery.create({
      data: {
        slug: '', // 初始为空，AI 生成完成后再更新
        userPrompt: query,
        aiSummary: 'Generating your personalized guide...',
        seoTitle: draftData.seoTitle || `${query} - Car Rental Guide`,
        seoContent: '', // 初始为空
      }
    });

    // 🚀 立即返回 taskId，让前端开始轮询
    const taskId = savedQuery.id;

    // 在后台异步完成 AI 生成和更新
    (async () => {
      try {
        // 更新记录为最终内容
        await prisma.aiQuery.update({
          where: { id: taskId },
          data: {
            slug: finalSlug + '.html',
            aiSummary: draftData.summary || 'Here is what I found for you.',
            seoContent: finalHtmlContent,
          }
        });

        revalidatePath('/sitemap.xml');
        console.log('✅ 文章发布成功！Sitemap 已更新。');
      } catch (err) {
        console.error('Background update error:', err);
      }
    })();

    return NextResponse.json({
      taskId: taskId, // 🚀 返回 taskId 供轮询
      summary: 'Generating your personalized guide...',
    });

  } catch (error) {
    console.error('AI Generation Error:', error);
    return NextResponse.json({ error: 'Failed to generate response' }, { status: 500 });
  }
}
