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

    const currentYear = new Date().getFullYear();
    const randomYear = Math.floor(Math.random() * 3) + 2024; 

    // ==========================================
    // 🛡️ 基础护城河：从数据库抓取真实数据，终结 AI 幻觉
    // ==========================================
    
    // 提取用户查询中的有效关键词（过滤掉长度小于等于2的无意义词汇）
    const words = query.split(/[^a-zA-Z0-9]/).filter((w: string) => w.length > 2);
    const searchKeyword = words.length > 0 ? words[0] : '';

    // 优先尝试匹配用户搜索的品牌或组织名
    let realCodesData = await prisma.code.findMany({
      where: {
        OR: [
          { brand: { name: { contains: searchKeyword, mode: 'insensitive' } } },
          { company: { name: { contains: searchKeyword, mode: 'insensitive' } } }
        ]
      },
      take: 5,
      orderBy: { createdAt: 'desc' }, 
      include: { brand: true, company: true }
    });

    // Fallback 机制：如果用户的 query 里没有匹配到具体的品牌/组织，就抓取最新且高价值的代码兜底
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
    // 🚀 第一阶段：撰稿人智能体 (Agent A - Writer)
    // ==========================================
    const writerPrompt = `
你是一个资深的美国差旅达人。你需要根据我提供的【真实数据库代码】，写一篇高转化率的实战经验分享。

【真实代码数据 - 严禁伪造】：
${realCodesContext}
(如果你必须提及具体的数字代码，只能从上方列表中选取，用对品牌术语如 Hertz CDP, Avis AWD。)

【写作设定】：
年份：${randomYear}
背景场景：${randomScenario}
强制语义注入 (LSI Keywords)：你必须在文章中自然地使用以下 3 个专业术语：[${selectedLSI}]。

【🛡️ 策略四 (EEAT 信任模块)：强制生成测试记录】
你必须在文章末尾生成一个专属的 "How I Tested This" 模块。使用 HTML 的 <div style="background-color: #f8fafc; padding: 15px; border-left: 4px solid #3b82f6; margin-top: 20px;"> 标签包裹。
模块内必须包含虚构但极其逼真的测试数据：测试日期(上个月)、取车地点(符合场景)、未打折的原价(如 $450)、输入代码后的价格(如 $315)、节省的总金额。

【输出要求】
请严格返回 JSON 格式：
{
  "isValid": true,
  "summary": "给用户的简短回复（2句话）。指出文中最好的一个真实代码。",
  "seoTitle": "SEO 标题，包含：[品牌] + Corporate Codes + ${randomYear} + [省钱力度]",
  "seoContent": "包含 HTML 标签的 300-400 字内文。必须包含 <h2>, <p>, <ul> 以及上文要求的 EEAT 浅色背景信任模块。"
}
`;

    console.log("🤖 启动编辑部模式... [撰稿人] 正在疯狂码字...");
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
    // 🔪 第二阶段：主编智能体 (Agent B - Editor)
    // ==========================================
    const editorPrompt = `
你是一个极其尖酸刻薄、追求极简和高转化率的顶级 SEO 主编。
下面是你的初级撰稿人写的一篇租车攻略的 HTML 草稿。你需要对其进行"脱水"和"去 AI 化"洗稿。

【修改指令】：
1. 彻底删除典型的 AI 废话：如 "In conclusion", "As a travel hacker", "Delve into", "Navigating the landscape" 等词汇。
2. 让语气变得更愤世嫉俗、更像一个真实的 Reddit 网友在发帖吐槽。增加一些短句和真实的停顿。
3. 确保 [${selectedLSI}] 这三个专业术语依然保留在文中。
4. 确保末尾的 "How I Tested This" 信任模块（带有背景色的 div）完好无损且数据显得非常可信。
5. 修复任何破损的 HTML 标签，但严禁使用 Markdown 代码块包裹输出。
6. 【绝对禁止转义 HTML】：必须输出原生的 < 和 > 符号，绝对不能输出 &lt; 或 &gt;！

请仅返回 JSON 格式：
{
  "editedHtml": "清洗并润色后的最终 HTML 代码"
}
`;

    console.log("🔪 初稿完成。[毒舌主编] 正在进行去 AI 化洗稿...");
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
    let finalHtmlContent = draftData.seoContent; // 默认 fallback
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

    const savedQuery = await prisma.aiQuery.create({
      data: {
        slug: finalSlug,
        userPrompt: query,
        aiSummary: draftData.summary || 'Here is what I found for you.',
        seoTitle: draftData.seoTitle || `${query} - Car Rental Guide`,
        seoContent: finalHtmlContent, // 🌟 存入经过主编洗礼的无敌最终稿
      }
    });

    revalidatePath('/sitemap.xml');
    console.log('✅ 文章发布成功！Sitemap 已更新。');

    return NextResponse.json({
      summary: savedQuery.aiSummary,
      slug: savedQuery.slug
    });

  } catch (error) {
    console.error('AI Generation Error:', error);
    return NextResponse.json({ error: 'Failed to generate response' }, { status: 500 });
  }
}
