// 文件路径：scripts/standalone-scraper.ts
import { chromium } from 'playwright';
import OpenAI from 'openai';
import * as fs from 'fs';
import dotenv from 'dotenv';
import * as readline from 'readline/promises';

// 加载环境变量
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const openai = new OpenAI({
  apiKey: process.env.VECTOR_ENGINE_API_KEY,
  baseURL: 'https://api.vectorengine.ai/v1',
});

/**
 * 🌟 核心升级：使用工业级 pdfjs-dist 提取文字
 */
async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const uint8Array = new Uint8Array(buffer);
  const loadingTask = pdfjs.getDocument({ data: uint8Array });
  const pdfDocument = await loadingTask.promise;
  
  let fullText = '';
  console.log(`⏳ 正在解析 PDF (共 ${pdfDocument.numPages} 页)...`);
  
  for (let i = 1; i <= pdfDocument.numPages; i++) {
    const page = await pdfDocument.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    fullText += pageText + '\n';
  }
  
  return fullText;
}

async function runScraper(targetUrl: string) {
  console.log(`\n🚀 [全能爬虫 V3.4 完美对齐版] 开始抓取: ${targetUrl}`);

  let pageText = '';
  let hiddenElements: any[] = [];

  const isPdf = targetUrl.split('?')[0].toLowerCase().endsWith('.pdf');

  if (isPdf) {
    console.log("📄 检测到 PDF 文档！启动工业级提取引擎...");
    try {
      const response = await fetch(targetUrl);
      if (!response.ok) throw new Error(`下载 PDF 失败: HTTP ${response.status}`);
      
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      pageText = await extractTextFromPdf(buffer);
      
      if (pageText.trim().length < 50) {
         console.warn("⚠️ 警告：提取文字极少，该 PDF 可能是纯图片扫描件，需要 OCR。");
      } else {
         console.log(`✅ PDF 提取成功！共 ${pageText.length} 字。`);
      }
    } catch (err) {
      console.error("❌ PDF 处理失败:", err);
      return;
    }
  } else {
    console.log("🌐 检测到普通网页，启动隐形浏览器...");
    // 🌟 补回防 403 屏蔽参数
    const browser = await chromium.launch({ 
      headless: false, 
      channel: 'chrome',
      args: ['--disable-blink-features=AutomationControlled']
    });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    });
    await context.addInitScript("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})");
    const page = await context.newPage();

    try {
      await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(5000); 

      const pageData = await page.evaluate(() => {
        const text = document.body.innerText.replace(/\s+/g, ' ').trim();
        const elements = Array.from(document.querySelectorAll('a, [data-code]'));
        const hidden = elements.map(el => {
          const href = el.getAttribute('href') || '';
          const dataCode = el.getAttribute('data-code') || '';
          if (href.includes('coupon') || dataCode) return { text: el.textContent, href, dataCode };
          return null;
        }).filter(Boolean);
        return { bodyText: text, hiddenElements: hidden };
      });
      
      pageText = pageData.bodyText;
      hiddenElements = pageData.hiddenElements;
      console.log(`✅ 网页提取成功！`);
    } catch (err) {
      console.error("❌ 网页处理失败:", err);
      return;
    } finally {
      await browser.close();
    }
  }

  // ==========================================
  // 🤖 AI 特征提取 (完美适配前端 BrandPage)
  // ==========================================
  try {
    console.log("🤖 正在呼叫 AI 进行深度清洗...");
    
    // 确保隐藏元素也被传递给 AI
    const safeBodyText = pageText.substring(0, 18000); 
    const safeHiddenElements = hiddenElements.length > 0 ? JSON.stringify(hiddenElements).substring(0, 5000) : "[]";

    const completion = await openai.chat.completions.create({
      model: "gemini-3.1-pro-preview",
      messages: [
        { 
          role: "system", 
          content: `你是一个专业的租车行业数据分析专家。请从提供的文本中提取租车折扣码，并严格按照我指定的格式输出，以适配我的前端展示逻辑。

          【字段映射规则】：
          1. brand: 租车品牌名（如 Hertz, Avis, Alamo）。
          2. company: 提供该折扣的【组织名称】（如 "NFL Alumni Association", "Santa Clara University"）。严禁填入租车品牌名！
          3. codeValue: 折扣码内容。
          4. description: 具体的折扣说明（如 "20% OFF", "Free Upgrade"）。
          5. codeType: 必须且只能从 ['business', 'leisure'] 中选一个！
             - 如果是针对协会成员、校友、大众或提到 personal use，填 'leisure'。
             - 如果是针对员工、商务差旅或提到 ID required，填 'business'。
          6. source: 来源分类标签。请从 ['Association', 'Employee', 'Public', 'Member'] 中选一个最贴切的。

          【特殊处理】：
          如果代码隐藏在链接中，请务必从【底层隐藏元素】的 href 或 dataCode 中提取。

          严格返回 JSON 数组格式，不要包含任何 Markdown 标签或解释文字。`
        },
        { 
          role: "user", 
          content: `【内容文本】：\n${safeBodyText}\n\n【底层隐藏元素】：\n${safeHiddenElements}` 
        }
      ],
      response_format: { type: "json_object" } 
    });

    const aiResponse = completion.choices[0].message.content || '{"data":[]}';
    const parsed = JSON.parse(aiResponse);
    const codes = parsed.data || parsed.codes || (Array.isArray(parsed) ? parsed : Object.values(parsed)[0]);

    console.log(`💡 AI 处理完毕，共解析 ${Array.isArray(codes) ? codes.length : 0} 条数据！`);
    fs.writeFileSync('output_codes.json', JSON.stringify(codes, null, 2), 'utf-8');
    console.log(`🎉 任务完成！结果已保存至 output_codes.json`);

  } catch (error) {
    console.error(`❌ AI 处理失败:`, error);
  }
}

async function main() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question('\n🔗 请输入目标 URL: ');
  rl.close();
  await runScraper(answer.trim());
}

main();