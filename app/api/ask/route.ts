// app/api/ask/route.ts
export const maxDuration = 300; // 🚀 防止 Vercel 10秒超时强杀后台进程

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

    // 🚀 修复 IBM 幻觉：精准检测用户是否真的搜了某个品牌或公司名 (✅ 动态正则消除)
    const dbCompanies = await prisma.company.findMany({ select: { name: true } });
    const dynamicCompanies = dbCompanies.map(c => c.name.toLowerCase());
    const userTargetedOrg = dynamicBrands.find(brand => queryLower.includes(brand)) || 
                            dynamicCompanies.find(company => queryLower.includes(company));

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

    // 🚀 CHAOS: No fixed scenarios. Let AI invent unique travel contexts per article.

    // 🚀 意图劫持杀手锏 (Intent Hijacking)
    let specializedPrompt = "";
    if (queryLower.includes("under 25") || queryLower.includes("young") || queryLower.includes("student")) {
      specializedPrompt = "🔥 [OVERRIDE SCENARIO]: Focus entirely on how to waive the 'Under 25 Young Driver Fee'. Make this the absolute core of the guide.";
    } else if (queryLower.includes("one way") || queryLower.includes("drop off") || queryLower.includes("different location")) {
      specializedPrompt = "🔥 [OVERRIDE SCENARIO]: Focus entirely on how the recommended codes eliminate the exorbitant 'One-Way Drop Fee'.";
    } else if (queryLower.includes("insurance") || queryLower.includes("ldw") || queryLower.includes("cdw") || queryLower.includes("cover")) {
      specializedPrompt = "🔥 [OVERRIDE SCENARIO]: Highlight that these elite codes include FREE Loss Damage Waiver (LDW) and liability coverage, saving them $25/day at the counter.";
    } else if (queryLower.includes("debit") || queryLower.includes("deposit") || queryLower.includes("credit card")) {
      specializedPrompt = "🔥 [OVERRIDE SCENARIO]: Emphasize that these codes have 'Corporate Liability' which forces the counter to accept debit cards and waives massive deposit holds.";
    } else if (queryLower.includes("sold out") || queryLower.includes("holiday")) {
      specializedPrompt = "🔥 [OVERRIDE SCENARIO]: Focus on how elite codes have a 'Guaranteed Availability' clause to bypass Sold Out status.";
    }

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
${specializedPrompt}

🚨 [CRITICAL OUTPUT CONSTRAINTS - MUST FOLLOW]:
1. LANGUAGE: You MUST output the entire response in 100% ENGLISH. ZERO CHINESE CHARACTERS ALLOWED.
2. Even if the user's query contains Chinese, you MUST respond entirely in English.
3. Do not use any Chinese punctuation (，。！？）. Use only English punctuation.
4. BANNED PHRASES: You MUST NOT use phrases like "As an experienced...", "As a seasoned...", "Listen up", "Dive in", or "In conclusion". Write directly and objectively without roleplaying preambles.

🚨 [WRITING DETAIL REQUIREMENTS - Flexible Structure, NO Fixed Templates]:
1. Website Operation: Mention specific website details naturally (input box locations, dropdown menus) - vary the depth based on the brand.
2. Counter Reality: Evaluate badge/ID check strictness at the location - use your own words, vary the tone (cautious vs confident).
3. Loyalty Perks: Mention points/membership benefits if relevant - don't force it if the scenario doesn't call for it.
4. Dynamic FAQ: Generate 2 questions based on the ACTUAL scenario you invented:
   - Question 1: Compare car classes OR pricing quirks OR insurance gotchas (vary this!).
   - Question 2: Address a logistical nightmare (toll roads, border crossings, one-way fees, after-hours drop-off, weather issues).
   - NEVER use "SUV vs Minivan" or "late flight" as defaults. Invent fresh problems for each article.

🚨 [DYNAMIC INTENT DETECTION]:
User's original search query: "${query}".
User specifically targeted org: "${userTargetedOrg || 'none'}".
1. 🎯 Expert Pitfall Avoidance Pivot: ONLY if the user SPECIFICALLY mentions a company (like "${userTargetedOrg || 'IBM'}") AND [Real Code Data] doesn't have it, then pivot: "The official ${userTargetedOrg || 'company'} internal code now checks badges extremely strictly..." 
   - ELSE (generic search): Focus entirely on the provided database codes as "Top Picks". Do NOT mention IBM or any specific company unless the user asked for it.
2. 📍 Location Detection: If the search query contains any specific city name, state name, or airport code (like LAX, Miami, Hawaii, NYC, etc.), you **MUST** use that location as the background for your practical experience!
3. 🎲 Fallback Scenario: If no location mentioned, invent a fresh travel context based on the brand and code type. DO NOT reuse common examples like Orlando Disney, Chicago conferences, or Denver skiing. Be creative: minor cities, national parks, wedding weekends, coastal drives, mountain retreats, etc.

[🛡️ STRATEGY 4 (EEAT Trust Module): Mandatory Test Record Generation]
You must generate an exclusive "How I Tested This" module at the end of the article. Wrap it in HTML: <div style="background-color: #f8fafc; padding: 20px; border-left: 4px solid #3b82f6; margin-top: 30px; border-radius: 0 8px 8px 0;">
The module must include fictional but highly realistic test data: Test Date: ${testMonthContext} (MUST strictly use this date!), Location (MUST strictly match the scenario or location decided above!), Original Price (e.g., $450), Price with Code (e.g., $315), Total Saved.

[TITLE GENERATION STRATEGY]
You MUST generate a unique SEO title under 60 chars. Strictly forbidden to use common templates like "Save X% Off".

CRITICAL RULE FOR YEAR IN TITLE (To ensure site variance):
- If the user's query contains the word "code" or "discount", DO NOT use the year ${targetYear} in the title. Use words like 'Verified' or 'Active' instead.
- IF the user's query does NOT contain those words, USE the year ${targetYear} in the title.

STEP 1: Choose the most suitable angle from below based on user search intent:
1. 🎯 Specific Audience: "IBM Employees", "AAA Members", "Government Workers", "Students"
2. 🌍 Specific Scenario: "Airport Pickup", "One-Way Rental", "Long-Term Lease", "Last-Minute Booking"
3. 💎 Unique Selling Point: "Free Upgrade", "Waived Young Driver Fee", "Unlimited Miles", "No Cancellation Fee"
4. ❓ Question Angle: "How to Get...", "Which Code is Best for...", "What's the Cheapest Way to..."
5. 📍 Location Focus: "in Los Angeles", "at LAX", "for NYC Business Travel"
6. 🔥 Urgency: "Limited Time", "This Month Only", "Before Rates Go Up"

STEP 2: Use ONE of these Title Formulas (Adapt your chosen Angle):
- [Brand] + [Audience/Scenario] + [Year or Validation Word] + [USP]
- How I Saved [Amount] on [Brand] Rentals ([Location or Year])
- The [Adjective] Guide to [Brand] [Code Type] Codes
- [Question Word] [Brand] [Scenario] [Year]?

CRITICAL RULES:
- Title MUST be under 60 characters
- NEVER put year in slug/URL - only in <title> tag and content body
- If query contains location, add it naturally

[OUTPUT REQUIREMENTS]
Please strictly return JSON format:
{
  "isValid": true,
  "summary": "Short reply to user (2 sentences). Point out the best real code in the article.",
  "seoTitle": "Unique SEO title strictly following the 2-Step Strategy above. If user's search query contains a location, MUST add it to the title.",
  "seoContent": "300-400 word content with HTML tags. Must include <h2>, <p>, <ul> and the EEAT light background trust module required above."
}
`;

    // 🚀 SYNC MODE: 同步等待 AI 完成（Vercel Serverless 兼容）
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
      console.error('Writer Agent failed to output valid JSON:', draftResponseText);
      return NextResponse.json({ error: 'AI writer failed to generate valid content' }, { status: 500 });
    }

    if (!draftData || !draftData.isValid) {
      console.log('Draft invalid.');
      return NextResponse.json({ error: 'AI generated invalid content' }, { status: 500 });
    }

    // 🚀 全自动内链收割机 (validInternalLinks)
    // 修正：代码详情页 URL 结构是 /codes/{brand}-{company}
    const validInternalLinks = realCodesData.map(c => 
      `Target: "${c.company.name}" -> URL: "/codes/${c.brand.slug}-${c.company.slug}"`
    ).join('\n');

    // � PHASE 2: Editor Agent (Agent B - Editor / Claude)
    const editorPrompt = `
[ROLE: Cynical 2026 SEO Editor | ID: Alex Chen's Shadow | lang=en]
[TONE: Brutally honest, Anti-corporate, Reddit-insider, Punchy]

=== THE 2026 GROUND TRUTH (CONTEXT) ===
- Current Situation: April 2026. Federal partial shutdown is causing massive TSA lines. People are fleeing airports for road trips.
- Industry Scam: Rental agencies are now using "AI-Damage-Scanners" at return bays to charge for microscopic scratches ($500+ a pop). 
- Counter Vibe: Agents are overworked and aggressive about upselling "concession recovery fees".

[VARS: LSI_TERMS=[${selectedLSI}]]
[VARS: INTERNAL_LINKS_DICT]
${validInternalLinks}

=== MANDATORY WORKFLOW ===
1. [TERMINATE CHINESE]: If any Chinese characters or punctuation (，。！？） exist, translate to sharp, high-level idiomatic English. 0% tolerance for non-English.
2. [KILL AI FLUFF]: Delete these immediately: "As an experienced...", "As a seasoned...", "Listen up", "Dive in", "In conclusion", "It is important to note", "crucial", "essential", "ultimate". 
3. [STYLE INJECTION - CHAOS MODE]: Rewrite transitions to be abrupt and punchy like Reddit or Flyertalk. CRITICAL: You are STRICTLY BANNED from using the phrases "Real talk", "Heads up", "Pro tip", "Truth is", "Look", or "Here's the deal". Instead, INVENT completely fresh, aggressive transition phrases (e.g., "The harsh reality:", "Forget what you heard:", "Bottom line:"). VARY your transition words in every article. NEVER use the same transition style twice.
4. [2026 CONTEXT INJECTION - CHAOS MODE]:
   - Randomly insert ONE timely industry warning into the main body paragraphs (NEVER in the FAQ or the Test Data module).
   - INVENT FRESH EXAMPLES each time. Never reuse the same warning twice.
   - Vary the topics: TSA delays, new rental fees, insurance changes, fuel policies, app glitches, counter upsells, vehicle shortages, weather disruptions.
   - Examples of variety (don't copy these exactly): staffing shortages at major hubs, new damage inspection apps, surge pricing algorithms, electric vehicle charging logistics, cross-border documentation changes.
5. [LSI VERIFICATION]: Ensure LSI_TERMS are woven into the story, not just listed at the end.
6. [SEO LINKING]: Scan the text for the 'Target' words from INTERNAL_LINKS_DICT. Wrap exactly ONE mention of each target in an HTML link: <a href="URL" class="text-blue-600 font-bold hover:underline">Target</a>.
7. [HTML SHIELD]: Do NOT modify the CSS/Styles in the <div style="..."> module. DO NOT add any extra text, warnings, or commentary inside the Test Data block. Keep the numbers clean.

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

    // 🚀 URL 年份剥离术 (Slug Purification)
    const rawTitleForSlug = draftData.seoTitle || query;
    const cleanTitleForSlug = rawTitleForSlug.replace(/\b202[0-9]\b/g, '').replace(/\s+/g, ' ').trim();
    const finalSlug = await generateUniqueSlug(prisma, cleanTitleForSlug, 60);

    // 🚀 直接保存最终文章，不再创建 pending 占位
    const savedQuery = await prisma.aiQuery.create({
      data: {
        slug: finalSlug + '.html',
        userPrompt: query,
        aiSummary: draftData.summary || 'Here is what I found for you.',
        seoContent: finalHtmlContent,
        seoTitle: draftData.seoTitle || `${query} - Car Rental Guide`,
      }
    });

    revalidatePath('/sitemap.xml');
    console.log(`✅ Article created: ${finalSlug}.html`);

    // 🚀 同步返回最终 slug，前端直接跳转
    return NextResponse.json({
      slug: finalSlug + '.html',
      summary: draftData.summary || 'Here is what I found for you.',
    });

  } catch (error) {
    console.error('AI Generation Error:', error);
    return NextResponse.json({ error: 'Failed to generate response' }, { status: 500 });
  }
}
