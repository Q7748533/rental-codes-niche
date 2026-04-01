// app/api/ask/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { generateStaticHtml } from '@/lib/htmlGenerator';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();

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
  "seoContent": "生成一篇 300-400 字的 HTML 格式内文，严禁使用机器人或百科全书口吻。
  
  【文章写作规范】：
  1. 必须使用第一人称（I, my experience）来写，假装这是你亲身经历的实战经验或朋友的爆料。
  2. 开头直接切入痛点（例如：'Renting a car at [地点] can be brutal, but I found a workaround...'）。
  3. 提到具体的机场缩写（如 LAX, JFK, MIA）或市中心街道，增加局部真实感。
  4. 给出 1 个利润最高的大厂商务码（Business Code），并分享这家租车公司在查工牌（ID Check）时有多严。
  5. 给出 1 个绝对安全的通用码/休闲码（如 AAA, Alumni, 航司会员），作为 'Safest Bet' 推荐。
  6. 结尾分享一个独家的 'Insider Tip'（比如避免附加费、如何积累积分等）。
  7. 使用 <h2>, <p>, <strong>, <ul> 等基础 HTML 标签排版，不要写复杂的样式。"
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

    // 6. 从 AI 生成的标题创建 slug（确保 URL 和标题一致）
    const seoTitleSlug = (aiData.seoTitle || query)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .substring(0, 60); // 限制长度
    const finalSlug = `${seoTitleSlug}-${Date.now().toString().slice(-4)}.html`;

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

    // 8. 获取相关文章用于静态 HTML
    const relatedArticles = await prisma.aiQuery.findMany({
      where: {
        slug: { not: savedQuery.slug },
      },
      orderBy: [
        { viewCount: 'desc' },
        { createdAt: 'desc' },
      ],
      take: 4,
      select: {
        slug: true,
        seoTitle: true,
        aiSummary: true,
        viewCount: true,
      },
    });

    // 9. 生成静态 HTML 文件！
    try {
      const publicDir = join(process.cwd(), 'public', 'ask');
      await mkdir(publicDir, { recursive: true });
      
      const htmlContent = generateStaticHtml({
        title: savedQuery.seoTitle,
        description: savedQuery.aiSummary,
        content: savedQuery.seoContent,
        summary: savedQuery.aiSummary,
        userPrompt: savedQuery.userPrompt,
        slug: savedQuery.slug,
        createdAt: savedQuery.createdAt.toISOString(),
        viewCount: savedQuery.viewCount,
        relatedArticles,
      });
      
      const filePath = join(publicDir, savedQuery.slug);
      await writeFile(filePath, htmlContent, 'utf-8');
      console.log(`Static HTML generated: ${filePath}`);

      // 重新验证 sitemap，让搜索引擎及时发现新页面
      revalidatePath('/sitemap.xml');
      console.log('Sitemap revalidated');
    } catch (fileError) {
      console.error('Failed to write static HTML file:', fileError);
      // 不影响 API 响应，继续返回成功
    }

    // 9. 把简短的回答和生成的文章链接返回给前端
    return NextResponse.json({
      summary: savedQuery.aiSummary,
      slug: savedQuery.slug
    });

  } catch (error) {
    console.error('AI Generation Error:', error);
    return NextResponse.json({ error: 'Failed to generate response' }, { status: 500 });
  }
}