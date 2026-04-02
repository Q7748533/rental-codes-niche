// app/api/ask/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateUniqueSlug } from '@/lib/slugify';
import OpenAI from 'openai';
import { revalidatePath } from 'next/cache';

const openai = new OpenAI({
  apiKey: process.env.VECTOR_ENGINE_API_KEY || "YOUR_API_KEY_HERE",
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
    // 🎯 CORE FIX 1: Precise Year Intent Capture & Timeline Lock
    // ==========================================
    const now = new Date();
    const currentYear = now.getFullYear();

    // Extract 4-digit year from user's query (e.g., "2024", "2025", "2026")
    const queryYearMatch = query.match(/\b(202[4-9])\b/);

    // [OPTIMIZATION]: If user didn't specify year, force current real year to prevent 2024/2025 time travel!
    const targetYear = queryYearMatch ? queryYearMatch[1] : currentYear.toString();

    // [OPTIMIZATION]: Dynamically calculate last month's date for highly realistic EEAT test data injection
    const lastMonthDate = new Date();
    lastMonthDate.setMonth(now.getMonth() - 1);
    const testMonthContext = lastMonthDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });

    // ==========================================
    // 🚗 CORE FIX 2: Dynamic Brand Radar (Real-time DB Sync)
    // ==========================================
    // Instantly fetch all brand names existing in your database
    const dbBrands = await prisma.brand.findMany({
      select: { name: true }
    });

    // Convert to lowercase array, e.g., ['hertz', 'avis', 'fox', 'europcar']
    const dynamicBrands = dbBrands.map(b => b.name.toLowerCase());
    const queryLower = query.toLowerCase();
    
    // Detect if user query contains brands that [actually exist] in your database
    const detectedBrand = dynamicBrands.find(brand => queryLower.includes(brand));

    // ==========================================
    // 🛡️ FOUNDATION MOAT: Fetch real data from database to end AI hallucinations
    // ==========================================
    const words = query.split(/[^a-zA-Z0-9]/).filter((w: string) => w.length > 2);
    // If radar detected a brand, use it; otherwise fallback to first meaningful word
    const searchKeyword = detectedBrand || (words.length > 0 ? words[0] : '');
    const lowerKeyword = searchKeyword.toLowerCase();

    // Prioritize matching user's searched brand, organization name or description
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

    // Fallback mechanism: If user's query is extremely niche with no matches, fetch latest high-value codes as backup
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
    // 🧠 STRATEGY 3 (LSI Injection): Build industry semantic entity library
    // ==========================================
    const lsiVocabulary = [
      "walk-up rate", "liability coverage", "counter bypass", "underage fee waiver",
      "blackout dates", "dynamic pricing", "airport concession fee", "base rate",
      "fleet availability", "premium upgrade", "drop-off charge", "loyalty tier status"
    ];
    // Randomly select 3 LSI terms for mandatory injection
    const selectedLSI = lsiVocabulary.sort(() => 0.5 - Math.random()).slice(0, 3).join(", ");

    // Random scenarios and tone
    const scenarios = [
      "A stressful family vacation to Disney World in Orlando (MCO)",
      "A last-minute tech conference at McCormick Place in Chicago (ORD)",
      "A winter ski trip flying into Denver International (DEN)",
      "A scenic Pacific Coast Highway road trip starting at SFO"
    ];
    const randomScenario = scenarios[Math.floor(Math.random() * scenarios.length)];

    // ==========================================
    // 🚀 PHASE 1: Writer Agent (Agent A - Writer / Gemini)
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
4. BANNED PHRASES: You MUST NOT use phrases like "As an experienced...", "As a seasoned...", "Listen up", "Dive in", or "In conclusion". Write directly and objectively without roleplaying preambles.

🚨 [WRITING DETAIL REQUIREMENTS - Must include all 4 points]:
1. Website Operation Guide: When recommending codes, briefly mention specific operation details on the rental company's website (e.g., Hertz's "Pay Later" option, Enterprise's dropdown menus, Avis's AWD input box location) to enhance practical usability.
2. Counter Check Strictness: In the tone of an experienced driver, evaluate how strictly the counter at [city or airport in the scenario] checks badges/IDs.
3. Points & Membership Benefits: Clearly tell users that using these recommended codes still allows normal accumulation of rental company loyalty points (like Hertz Gold Plus Rewards, Avis Preferred, etc.) or skip-the-line privileges at the counter.
4. Unique Scene-Based FAQ: At the end of the article (just before the EEAT module), generate an HTML <h3>Unique Scenarios & FAQs</h3>. Then, write 2 highly specific questions and answers related ONLY to this user's query context. (Example: If the query is about "Chicago ORD", ask "Will the counter at ORD ask for my IBM badge?"). DO NOT write generic templates like "How to use a CDP code".

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

    // 🚀 1. 拦截点：先创建一条空的占位记录，立即拿到 taskId
    const savedQuery = await prisma.aiQuery.create({
      data: {
        slug: '', // 留空，作为未完成的标志
        userPrompt: query,
        aiSummary: 'Generating your personalized guide...',
        seoTitle: `${query} - Car Rental Guide`,
        seoContent: '',
      }
    });

    const taskId = savedQuery.id;

    // 🚀 2. 核心剥离：把所有会阻塞的 AI 调用扔进后台异步闭包
    (async () => {
      try {
        console.log("🤖 [Writer Gemini] is writing...");
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
          console.error('Writer Agent failed to output valid JSON.');
          return;
        }

        if (!draftData.isValid) {
          console.log('Draft invalid, terminating background task.');
          return;
        }

        // 🔪 PHASE 2: Editor Agent (Agent B - Editor / Claude)
        const editorPrompt = `
[ROLE: Cynical English SEO Editor | ton=cynical,direct,anti-corporate | lang=en]
[STRICT RULE: REMOVE ALL CHINESE CHARACTERS]
If you find any Chinese text or punctuation in the draft, translate it into natural, high-level business English immediately.
The final output must be 100% English. No Chinese characters allowed.

[INPUT: draft_html]
[VARS: LSI_TERMS=[${selectedLSI}]]

=== WORKFLOW ===
[STEP1: SCAN|tgt=Chinese-chars]=>[TRANS: en]
[STEP2: SCAN|tgt=AI-fluff]=>[DEL: "As an experienced", "As a seasoned", "I can tell you that", "Not only does it", "listen up", "dive in", "crucial", "essential", "ultimate"]
[STEP3: REWRITE|tgt=transitions]=>[RULE: Do not use formal transition words like "However,", "Moreover,", "Furthermore," at the start of sentences. Make it punchy and abrupt like a Reddit comment.]
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

        console.log("🔪 [Editor Claude] is refining...");
        const editorCompletion = await openai.chat.completions.create({
          model: "claude-opus-4-6",
          messages: [
            { role: "system", content: editorPrompt },
            { role: "user", content: `[DRAFT_HTML_INPUT]:\n${draftData.seoContent}` }
          ],
          temperature: 0.4,
          response_format: { type: "json_object" }
        });

        const editorResponseText = editorCompletion.choices[0].message.content || '{}';
        let finalHtmlContent = draftData.seoContent;
        try {
          const editorData = JSON.parse(editorResponseText.match(/\{[\s\S]*\}/)?.[0] || editorResponseText);
          if (editorData.editedHtml) finalHtmlContent = editorData.editedHtml;
        } catch (e) {
          console.warn('Editor Agent failed, using draft HTML.');
        }

        const finalSlug = await generateUniqueSlug(prisma, draftData.seoTitle || query, 60);

        // 🚀 3. 后台任务完成，更新数据库写入 slug，这会触发前端轮询成功
        await prisma.aiQuery.update({
          where: { id: taskId },
          data: {
            slug: finalSlug + '.html',
            aiSummary: draftData.summary || 'Here is what I found for you.',
            seoContent: finalHtmlContent,
            seoTitle: draftData.seoTitle || `${query} - Car Rental Guide`,
          }
        });

        revalidatePath('/sitemap.xml');
        console.log(`✅ Task ${taskId} completed.`);
      } catch (err) {
        console.error('Background AI task error:', err);
      }
    })(); // <-- 异步闭包立即执行完毕，不阻塞主线程

    // 🚀 4. 立即返回 taskId！前端不再死等！
    return NextResponse.json({
      taskId: taskId,
      summary: 'Generating your personalized guide...',
    });

  } catch (error) {
    console.error('AI Generation Error:', error);
    return NextResponse.json({ error: 'Failed to generate response' }, { status: 500 });
  }
}
