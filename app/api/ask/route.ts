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
      ? realCodesData.map(c => `- Brand: ${c.brand.name} | Organization: ${c.company.name} | Code: ${c.codeValue} | Type: ${c.codeType || 'N/A'} | Description: ${c.description || 'None'}`).join('\n')
      : "No specific codes available. Provide general safe rental advice. DO NOT fabricate codes.";

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
You are a seasoned US travel expert and car rental strategist.
Your task is to write a high-conversion, firsthand experience guide based on the provided [Real Database Codes].

[REAL CODE DATA - DO NOT FABRICATE]:
${realCodesContext}
(If you must mention specific numeric codes, only select from the list above. Use correct brand terminology like Hertz CDP, Avis AWD.)

[WRITING SETTINGS]:
- Year: ${targetYear}
- Mandatory LSI Terms (Must naturally include these 3 professional terms): [${selectedLSI}]

🚨 [CRITICAL OUTPUT CONSTRAINTS - MUST FOLLOW]:
1. LANGUAGE: You MUST output the entire response in 100% ENGLISH. ZERO CHINESE CHARACTERS ALLOWED.
2. Even if the user's query contains Chinese, you MUST respond entirely in English.
3. Do not use any Chinese punctuation (，。！？）. Use only English punctuation.

🚨 [WRITING DETAIL REQUIREMENTS - Must include all 3 points]:
1. Website Operation Guide: When recommending codes, briefly mention specific operation details on the rental company's website (e.g., Hertz's "Pay Later" option, Enterprise's dropdown menus, Avis's AWD input box location) to enhance practical usability.
2. Counter Check Strictness: In the tone of an experienced driver, evaluate how strictly the counter at [city or airport in the scenario] checks badges/IDs.
3. Points & Membership Benefits: Clearly tell users that using these recommended codes still allows normal accumulation of rental company loyalty points (like Hertz Gold Plus Rewards, Avis Preferred, etc.) or享受免排队通道。

🚨 [DYNAMIC INTENT DETECTION]:
User's original search query: "${query}".
1. 🎯 Expert Pitfall Avoidance Pivot: If the search query specifies a specific rental brand or company (like IBM), but [Real Code Data] happens to not have it, [ABSOLUTELY DO NOT] say "I don't have it in my database." You must pivot like an experienced driver: "The official [search term] internal code now checks badges extremely strictly at the counter and is easily caught. For safety, I strongly recommend using these equally powerful alternatives that don't require ID checks:"
2. 📍 Location Detection: If the search query contains any specific city name, state name, or airport code (like LAX, Miami, Hawaii, NYC, etc.), you **MUST** use that location as the background for your practical experience!
3. 🎲 Fallback Scenario: If the search query doesn't mention a location, use this random scenario as the background: ${randomScenario}.

[🛡️ STRATEGY 4 (EEAT Trust Module): Mandatory Test Record Generation]
You must generate an exclusive "How I Tested This" module at the end of the article. Wrap it in HTML: <div style="background-color: #f8fafc; padding: 20px; border-left: 4px solid #3b82f6; margin-top: 30px; border-radius: 0 8px 8px 0;">
The module must include fictional but highly realistic test data: Test Date: ${testMonthContext} (MUST strictly use this date!), Location (MUST strictly match the scenario or location decided above!), Original Price (e.g., $450), Price with Code (e.g., $315), Total Saved.

[TITLE GENERATION STRATEGY - Avoid Templates]
You must generate a unique, attractive title. Strictly forbidden to use common templates like "Save X% Off".

Choose the most suitable angle from below based on user search intent:
1. 🎯 Specific Audience Angle: "IBM Employees", "AAA Members", "Government Workers", "Students"
2. 🌍 Specific Scenario Angle: "Airport Pickup", "One-Way Rental", "Long-Term Lease", "Last-Minute Booking"
3. 💎 Unique Selling Point Angle: "Free Upgrade", "Waived Young Driver Fee", "Unlimited Miles", "No Cancellation Fee"
4. ❓ Question Angle: "How to Get...", "Which Code is Best for...", "What's the Cheapest Way to..."
5. 📍 Location Focus Angle: "in Los Angeles", "at LAX", "for NYC Business Travel"
6. 🔥 Urgency Angle: "Limited Time", "This Month Only", "Before Rates Go Up"

Title Formula (choose one, don't mix):
- [Brand] + [Audience/Scenario] + [Year] + [Unique Selling Point]
- How I Saved [Amount] on [Brand] Rentals ([Year])
- The [Adjective] Guide to [Brand] [Code Type] Codes
- [Question Word] [Brand] [Scenario] [Year]?

[OUTPUT REQUIREMENTS]
Please strictly return JSON format:
{
  "isValid": true,
  "summary": "Short reply to user (2 sentences). Point out the best real code in the article.",
  "seoTitle": "Unique, non-templated SEO title (within 60 characters). Avoid 'Save X% Off' format. Must include year ${targetYear}. If user's search query contains a location, MUST add it to the title.",
  "seoContent": "300-400 word content with HTML tags. Must include <h2>, <p>, <ul> and the EEAT light background trust module required above."
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
[ROLE: Cynical English SEO Editor | ton=cynical,direct,anti-corporate | lang=en]
[STRICT RULE: REMOVE ALL CHINESE CHARACTERS]
If you find any Chinese text or punctuation in the draft, translate it into natural, high-level business English immediately.
The final output must be 100% English. No Chinese characters allowed.

[INPUT: draft_html]
[VARS: LSI_TERMS=[${selectedLSI}]]

=== WORKFLOW ===
[STEP1: SCAN|tgt=Chinese-chars]=>[TRANS: en]
[STEP2: SCAN|tgt=AI-fluff]=>[DEL: "As an experienced...", "In conclusion", "Fortunately,"]
[STEP3: SCAN|tgt=cliches]=>[BAN: "Real talk", "Look:", "Here's the deal", "Game-changer"]
[STEP4: REWRITE|ton=cynical|sty=short-sentences,reddit-rant]
[STEP5: CHECK|tgt=LSI_TERMS|action=ensure-exist]
[STEP6: EXTRACT|tgt=<div style="background-color: #f8fafc...">]=>[SHIELD: HTML+CSS|allow-modify=false]
[STEP7: FMT|tgt=tags]=>[FIX: broken-html]

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
