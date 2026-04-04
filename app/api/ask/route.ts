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

    // [OPTIMIZATION]: 随机回溯 15-50 天，产生更真实的测试日期（避免全站 March 2026）
    const randomDaysBack = Math.floor(Math.random() * 35) + 15;
    const testDate = new Date(now.getTime() - randomDaysBack * 24 * 60 * 60 * 1000);
    const testMonthContext = testDate.toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

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

    // 🚀 修复 IBM 幻觉：精准检测用户是否真的搜了某个品牌或公司名
    const userTargetedOrg = dynamicBrands.find(brand => queryLower.includes(brand)) || 
                           (queryLower.match(/(ibm|google|pwc|kpmg|amazon|accenture|microsoft|apple|meta)/)?.[0]);

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
4. Unique Scene-Based FAQ: At the end of the article (just before the EEAT module), generate an HTML <h3>Unique Scenarios & FAQs</h3>. Then, write 2 highly specific questions:
   - Question 1: Must be about a specific car class (SUV vs Minivan) at this location.
   - Question 2: Must be about a "What if" scenario (e.g., late flight, lost badge, or drop-off location).
   - NEVER use the "How to save money" generic template. DO NOT write generic templates like "How to use a CDP code".

🚨 [DYNAMIC INTENT DETECTION]:
User's original search query: "${query}".
User specifically targeted org: "${userTargetedOrg || 'none'}".
1. 🎯 Expert Pitfall Avoidance Pivot: ONLY if the user SPECIFICALLY mentions a company (like "${userTargetedOrg || 'IBM'}") AND [Real Code Data] doesn't have it, then pivot: "The official ${userTargetedOrg || 'company'} internal code now checks badges extremely strictly..." 
   - ELSE (generic search): Focus entirely on the provided database codes as "Top Picks". Do NOT mention IBM or any specific company unless the user asked for it.
2. 📍 Location Detection: If the search query contains any specific city name, state name, or airport code (like LAX, Miami, Hawaii, NYC, etc.), you **MUST** use that location as the background for your practical experience!
3. 🎲 Fallback Scenario: If the search query doesn't mention a location, use this random scenario as the background: ${randomScenario}.

[🛡️ STRATEGY 4 (EEAT Trust Module): Mandatory Test Record Generation]
You must generate an exclusive "How I Tested This" module at the end of the article. Wrap it in HTML: <div style="background-color: #f8fafc; padding: 20px; border-left: 4px solid #3b82f6; margin-top: 30px; border-radius: 0 8px 8px 0;">
The module must include fictional but highly realistic test data: Test Date: ${testMonthContext} (MUST strictly use this date!), Location (MUST strictly match the scenario or location decided above!), Original Price (e.g., $450), Price with Code (e.g., $315), Total Saved.

[TITLE GENERATION STRATEGY - Chaos Variation Method]
You MUST choose ONE of the following three formats randomly to maintain natural variance across the site. This prevents Google from detecting programmatic spam patterns.

Format A - Date Anchor (40% chance): Include current month and year for high CTR.
Examples: "Avis IBM Code (Working April 2026)", "Hertz Deloitte CDP | 2026 Validation Guide"

Format B - Status Modifier (30% chance): Use strong validation words WITHOUT year. Timeless evergreen titles.
Examples: "Active Enterprise Codes for AAA Members", "100% Verified National Contract IDs", "Working Budget BCD Rates"

Format C - Pain Point Question (30% chance): Phrase as question focusing on counter ID check. High PAA/Featured Snippet potential.
Examples: "Does Avis Check IBM Employee Badges?", "How to Bypass Hertz Counter Checks?", "Budget Corporate Codes Without ID?"

CRITICAL RULES:
- Title MUST be under 60 characters
- NEVER put year in slug/URL - only in <title> tag and content body
- If query contains location, add it naturally
- Avoid templates like "Save X% Off" or generic "Guide to..."

[OUTPUT REQUIREMENTS]
Please strictly return JSON format:
{
  "isValid": true,
  "summary": "Short reply to user (2 sentences). Point out the best real code in the article.",
  "seoTitle": "Unique SEO title (under 60 chars). Use Chaos Variation: Format A (date+year 40%), Format B (status words no-year 30%), Format C (question format 30%). No templates.",
  "seoContent": "300-400 word content with HTML tags. Must include <h2>, <p>, <ul> and the EEAT light background trust module required above."
}
`;

    // 🚀 1. 拦截点：生成唯一临时 slug，创建占位记录，立即拿到 taskId
    const tempSlug = `pending-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const savedQuery = await prisma.aiQuery.create({
      data: {
        slug: tempSlug, // 🚀 使用唯一临时 slug，避免 UNIQUE constraint 错误
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
[ROLE: Cynical 2026 SEO Editor | ID: Alex Chen's Shadow | lang=en]
[TONE: Brutally honest, Anti-corporate, Reddit-insider, Punchy]

=== THE 2026 GROUND TRUTH (CONTEXT) ===
- Current Situation: April 2026. Federal partial shutdown is causing massive TSA lines. People are fleeing airports for road trips.
- Industry Scam: Rental agencies are now using "AI-Damage-Scanners" at return bays to charge for microscopic scratches ($500+ a pop). 
- Counter Vibe: Agents are overworked and aggressive about upselling "concession recovery fees".

=== MANDATORY WORKFLOW ===
1. [TERMINATE CHINESE]: If any Chinese characters or punctuation (，。！？） exist, translate to sharp, high-level idiomatic English. 0% tolerance for non-English.
2. [KILL AI FLUFF]: Delete these immediately: "As an experienced...", "As a seasoned...", "Listen up", "Dive in", "In conclusion", "It is important to note", "crucial", "essential", "ultimate". 
3. [STYLE INJECTION]: Rewrite transitions to be abrupt. Use "Look," "The reality is," "Here's the play," or just start the sentence. No formal bridge words.
4. [2026 CONTEXT INJECTION]: 
   - Randomly insert ONE "2026-specific" warning into the flow: 
     - E.g., "With the current 2026 TSA chaos, don't count on a late pickup holding your car."
     - E.g., "Take a video of the bumper; these 2026 AI-scanners are ruthless on tiny dings."
5. [LSI VERIFICATION]: Ensure [${selectedLSI}] are woven into the story, not just listed at the end.
6. [HTML SHIELD]: Do NOT modify the CSS/Styles in the <div style="..."> module. Keep the test data intact.

=== BEHAVIOR ===
[OUTPUT: JSON ONLY]
[ESCAPE_MARKDOWN: FALSE]

{
  "editedHtml": "Return the final refined HTML here. Use <h2> and <p> only. Ensure a 'no-nonsense' flow."
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
        // 🚀 修复状态死循环：更新数据库为失败状态，让前端停止轮询
        try {
          await prisma.aiQuery.update({
            where: { id: taskId },
            data: {
              aiSummary: 'Generation failed. Please try again.',
              seoContent: '<p>Sorry, we encountered an error generating your guide. Please <a href="/ask">try again</a> or contact support.</p>',
              seoTitle: 'Generation Failed',
            }
          });
        } catch (updateErr) {
          console.error('Failed to update error status:', updateErr);
        }
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
