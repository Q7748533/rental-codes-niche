// app/api/ask/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import OpenAI from 'openai';
import { revalidatePath } from 'next/cache';

// 接入你强大的 VectorEngine 接口
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

    // 1. 生成唯一的 Slug (例如将 "best code for miami" 变成 "best-code-for-miami")
    const baseSlug = query.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const slug = `${baseSlug}-${Date.now().toString().slice(-4)}`; // 加上时间戳防止 URL 重复

    // 获取随机年份 (2024-2026)
    const currentYear = new Date().getFullYear();
    const randomYear = Math.floor(Math.random() * 3) + 2024; // 随机 2024, 2025, 或 2026

    // 2. 强大的 Prompt：给 Gemini 定下极其严苛的规矩
    const systemPrompt = `
你是一个资深的美国差旅达人（常旅客黑客），经常在 Flyertalk 和 Reddit 上分享租车省钱攻略。
用户正在搜索关于租车折扣码（Corporate codes, CDP, AWD等）的信息。

【重要】当前年份参考：${randomYear}年

【输出要求】
请严格按照以下 JSON 格式返回，不要输出任何额外的废话或 Markdown 代码块标记：

{
  "isValid": true,
  "summary": "给用户的简短回复（2句话）。直接给出一个最高效的代码，并像个老朋友一样提醒一句查 ID 的风险。",
  "seoTitle": "吸引人的 SEO 标题，必须包含：[品牌名] + Corporate/Discount Codes + ${randomYear} + 具体的折扣力度（如 Save Up To 25%）",
  "seoContent": "生成一篇 300-400 字的 HTML 格式内文，必须使用 HTML 标签（<h2>, <p>, <strong>, <ul>, <li>）进行排版。严禁使用纯文本或 Markdown 格式。\n  \n  【HTML 格式要求】：\n  - 使用 <h2> 作为小标题（如 <h2>My Experience with IBM Code</h2>）\n  - 使用 <p> 包裹段落\n  - 使用 <strong> 高亮重要信息（如代码数字、折扣百分比）\n  - 使用 <ul> 和 <li> 列出要点\n  \n  【文章写作规范】：\n  1. 必须使用第一人称（I, my experience）来写，假装这是你亲身经历的实战经验或朋友的爆料。\n  2. 开头直接切入痛点（例如：'Renting a car at [地点] can be brutal, but I found a workaround...'）。\n  3. 提到具体的机场缩写（如 LAX, JFK, MIA）或市中心街道，增加局部真实感。\n  4. 给出 1 个利润最高的大厂商务码（Business Code），并分享这家租车公司在查工牌（ID Check）时有多严。\n  5. 给出 1 个绝对安全的通用码/休闲码（如 AAA, Alumni, 航司会员），作为 'Safest Bet' 推荐。\n  6. 结尾分享一个独家的 'Insider Tip'（比如避免附加费、如何积累积分等）。\n  \n  【重要】：seoContent 字段必须包含有效的 HTML 标签，例如：<h2>...</h2><p>...</p>，不能是纯文本。"
}
`;

    // 3. 呼叫 Gemini 模型 (通过 VectorEngine)
    const completion = await openai.chat.completions.create({
      model: "gemini-3.1-pro-preview", // VectorEngine 支持的 Gemini 模型
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: query }
      ],
      temperature: 0.7,
    });

    const aiResponseText = completion.choices[0].message.content || '{}';
    
    // 4. 解析 AI 响应（处理可能的 JSON 格式问题）
    let aiData;
    try {
      // 尝试提取 JSON 内容（AI 有时会包裹在代码块中）
      const jsonMatch = aiResponseText.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : aiResponseText;
      aiData = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Raw Response:', aiResponseText);
      return NextResponse.json({ 
        error: 'Failed to parse AI response. Please try again.' 
      }, { status: 500 });
    }

    // 5. 拦截无效请求（比如用户搜了赌场或违禁词）
    if (!aiData.isValid) {
      return NextResponse.json({ 
        summary: aiData.summary || "Sorry, I can only help with car rental corporate codes and travel discounts.",
        slug: "" 
      });
    }

    // 6. 从 AI 生成的标题创建 SEO 友好的 slug
    // 提取核心关键词：品牌名 + corporate codes + 年份 + 公司名
    const extractCoreKeywords = (title: string): string => {
      const lower = title.toLowerCase();
      
      // 提取品牌名 (hertz, enterprise, avis, budget, national, alamo, dollar, thrifty)
      const brandMatch = lower.match(/\b(hertz|enterprise|avis|budget|national|alamo|dollar|thrifty)\b/);
      const brand = brandMatch ? brandMatch[1] : '';
      
      // 提取年份
      const yearMatch = lower.match(/\b(202\d)\b/);
      const year = yearMatch ? yearMatch[1] : '';
      
      // 提取公司/组织名 (IBM, Amazon, Deloitte, AAA 等)
      const companyMatch = title.match(/\b(IBM|Amazon|Deloitte|Microsoft|Google|Apple|AAA|Costco|Sam's Club|AARP)\b/i);
      const company = companyMatch ? companyMatch[1].toLowerCase() : '';
      
      // 构建核心 slug：品牌-corporate-codes-年份-公司
      const parts = [brand, 'corporate', 'codes', year, company].filter(Boolean);
      
      // 如果提取失败，回退到清理后的标题
      if (parts.length < 2) {
        return title
          .toLowerCase()
          .replace(/\b(up|to|with|the|and|or|for|in|on|at|by|from|save|discount|code|codes)\b/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
          .replace(/-+/g, '-')
          .substring(0, 50);
      }
      
      return parts.join('-');
    };
    
    const seoTitleSlug = extractCoreKeywords(aiData.seoTitle || query);
    const finalSlug = `${seoTitleSlug}.html`;

    // 7. 将这篇新鲜出炉的 SEO 文章永久存入数据库！
    const savedQuery = await prisma.aiQuery.create({
      data: {
        slug: finalSlug,
        userPrompt: query,
        aiSummary: aiData.summary || 'Here is what I found for you.',
        seoTitle: aiData.seoTitle || `${query} - Car Rental Guide`,
        seoContent: aiData.seoContent || `<p>${aiData.summary}</p>`,
      }
    });

    // 重新验证 sitemap，让搜索引擎及时发现新页面
    revalidatePath('/sitemap.xml');
    console.log('Sitemap revalidated');

    // 把简短的回答和生成的文章链接返回给前端
    return NextResponse.json({
      summary: savedQuery.aiSummary,
      slug: savedQuery.slug
    });

  } catch (error) {
    console.error('AI Generation Error:', error);
    return NextResponse.json({ error: 'Failed to generate response' }, { status: 500 });
  }
}