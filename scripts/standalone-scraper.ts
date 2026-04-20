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
    
    // 🔄 PDF 下载重试机制
    let pdfRetries = 3;
    let pdfLastError: any;
    let pdfDownloaded = false;
    
    while (pdfRetries > 0 && !pdfDownloaded) {
      try {
        console.log(`🌐 正在下载 PDF (剩余重试次数: ${pdfRetries})...`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时
        
        const response = await fetch(targetUrl, {
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) throw new Error(`下载 PDF 失败: HTTP ${response.status}`);
        
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        pageText = await extractTextFromPdf(buffer);
        
        if (pageText.trim().length < 50) {
           console.warn("⚠️ 警告：提取文字极少，该 PDF 可能是纯图片扫描件，需要 OCR。");
        } else {
           console.log(`✅ PDF 提取成功！共 ${pageText.length} 字。`);
        }
        
        pdfDownloaded = true;
        break;
      } catch (err) {
        pdfLastError = err;
        pdfRetries--;
        if (pdfRetries > 0) {
          console.log(`⚠️ PDF 下载失败，${4 - pdfRetries}秒后重试...`);
          await new Promise(resolve => setTimeout(resolve, (4 - pdfRetries) * 1000));
        }
      }
    }
    
    if (!pdfDownloaded) {
      console.error("❌ PDF 处理失败（已重试3次）:", pdfLastError);
      console.log("💡 建议：请检查 PDF 链接是否可访问，或尝试使用浏览器直接下载");
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
      // 🔄 添加重试机制
      let retries = 3;
      let lastError: any;
      
      while (retries > 0) {
        try {
          console.log(`🌐 正在访问: ${targetUrl} (剩余重试次数: ${retries})`);
          // 使用 domcontentloaded 而不是 networkidle，更快完成加载
          await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
          // 等待额外时间让 JavaScript 渲染内容
          await page.waitForTimeout(5000);
          break; // 成功则跳出循环
        } catch (err) {
          lastError = err;
          retries--;
          if (retries > 0) {
            console.log(`⚠️ 连接失败，${3 - retries}秒后重试...`);
            await page.waitForTimeout((3 - retries) * 1000);
          }
        }
      }
      
      if (retries === 0) {
        throw lastError;
      }
      
      await page.waitForTimeout(3000);
      
      // 📂 展开所有折叠面板（点击所有 retailer-offer-collapse 元素）
      console.log("📂 正在展开所有折叠面板...");
      await page.evaluate(() => {
        const collapseElements = document.querySelectorAll('.retailer-offer-collapse, [class*="collapse"], [class*="accordion"]');
        collapseElements.forEach(el => {
          (el as HTMLElement).click();
        });
      });
      await page.waitForTimeout(2000); // 等待展开动画完成
      
      //  按区块提取每个优惠的详细信息
      const pageData = await page.evaluate(() => {
        // 提取所有优惠区块
        const offerBlocks: any[] = [];
        const offerElements = document.querySelectorAll('.retailer-offer, [itemprop="offers"], [class*="offer"]');
        
        offerElements.forEach((el, index) => {
          const titleEl = el.querySelector('h2, .title, [class*="title"]');
          const descEl = el.querySelector('p, .description, [class*="desc"]');
          const codeEl = el.querySelector('[class*="code"], .code');
          const linkEl = el.querySelector('a[href*="budget.com"]');
          
          // 从文本中提取 BCD code
          const fullText = el.textContent || '';
          const bcdMatch = fullText.match(/BCD\s*(?:code|#)?\s*:?\s*(Z\d{6})/i);
          const code = codeEl?.textContent || (bcdMatch ? bcdMatch[1] : '');
          
          // 提取过期时间
          const expMatch = fullText.match(/Expiration:\s*([^\n]+)/i);
          const expiration = expMatch ? expMatch[1].trim() : '';
          
          if (titleEl && code) {
            offerBlocks.push({
              index: index + 1,
              title: titleEl.textContent?.trim() || '',
              description: descEl?.textContent?.trim().substring(0, 200) || '',
              code: code.trim(),
              expiration: expiration,
              href: linkEl?.getAttribute('href') || '',
              fullText: fullText.substring(0, 1000)
            });
          }
        });
        
        // 同时提取通用隐藏元素
        const elements = Array.from(document.querySelectorAll('a, [data-code], [data-bcd], [data-coupon]'));
        const hidden = elements.map(el => {
          const href = el.getAttribute('href') || '';
          const dataCode = el.getAttribute('data-code') || '';
          const dataBcd = el.getAttribute('data-bcd') || '';
          if (href.includes('coupon') || dataCode || dataBcd) return { text: el.textContent, href, dataCode, dataBcd };
          return null;
        }).filter(Boolean);
        
        // 构建结构化文本
        const structuredText = offerBlocks.map(block => 
          `【优惠 ${block.index}】\n标题: ${block.title}\n代码: ${block.code}\n折扣: ${block.description}\n过期: ${block.expiration}\n链接: ${block.href}\n`
        ).join('\n---\n');
        
        return { 
          bodyText: structuredText + '\n\n=== 页面其他内容 ===\n' + document.body.innerText.replace(/\s+/g, ' ').trim(), 
          hiddenElements: hidden,
          offerBlocks: offerBlocks
        };
      });
      
      console.log(`📦 提取到 ${pageData.offerBlocks?.length || 0} 个优惠区块`);
      
      // 只使用当前页面内容，不深入抓取其他页面
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
          1. brand: 租车品牌名（如 Hertz, Avis, Alamo, Budget）。
          2. company: 提供该折扣的【组织名称】（如 "NFL Alumni Association", "Santa Clara University", "State of California employees"）。严禁填入租车品牌名！
          3. codeValue: 折扣码内容（只返回纯代码，如 Z408900, D134100, 123456）。严禁包含 AWD/BCD/CDP 前缀或 "code:" 等文字！
          4. description: 具体的折扣说明（如 "UP TO 25% OFF", "UP TO 35% OFF PAY NOW RATES"）。
          5. codeType: 必须且只能从 ['business', 'leisure'] 中选一个！
             - 如果是针对协会成员、校友、大众、member perks 或提到 personal use，填 'leisure'。
             - 如果是针对员工、商务差旅、需要 ID 验证或提到 employee，填 'business'。
          6. source: 来源分类标签。请从 ['Association', 'Employee', 'Public', 'Member'] 中选一个最贴切的。

          【特殊处理 - 重要】：
          1. 页面可能包含多个不同的优惠码，请提取【所有】找到的优惠码，不要只提取第一个！
          2. 如果多个条目共享同一个 codeValue（如 Z408900），但针对不同公司/组织，请为每个组织创建单独的记录。
          3. 从【子页面】内容中提取具体的 BCD/CDP 代码和折扣详情。
          4. 如果代码隐藏在链接或按钮中，请务必提取 href 或 dataCode 中的代码。

          【输出格式】：
          严格返回 JSON 对象，格式为 {"data": [...]}，不要包含任何 Markdown 标签或解释文字。
          确保 data 数组中包含所有提取到的优惠码记录。`
        },
        { 
          role: "user", 
          content: `【内容文本】：\n${safeBodyText}\n\n【底层隐藏元素】：\n${safeHiddenElements}` 
        }
      ],
      response_format: { type: "json_object" } 
    });

    let aiResponse = completion.choices[0].message.content || '{"data":[]}';
    
    // 🛠️ 清理 AI 响应中可能包含的 Markdown 代码块标记
    aiResponse = aiResponse
      .replace(/^```json\s*/i, '')  // 移除开头的 ```json
      .replace(/^```\s*/i, '')      // 移除开头的 ```
      .replace(/```\s*$/i, '')      // 移除结尾的 ```
      .trim();
    
    const parsed = JSON.parse(aiResponse);
    let codes = parsed.data || parsed.codes || (Array.isArray(parsed) ? parsed : Object.values(parsed)[0]);

    // 🧹 去重处理：基于 brand + company + codeValue 组合去重
    if (Array.isArray(codes) && codes.length > 0) {
      const seen = new Set<string>();
      codes = codes.filter((code: any) => {
        const key = `${code.brand?.toLowerCase() || ''}|${code.company?.toLowerCase() || ''}|${code.codeValue?.toLowerCase() || ''}`;
        if (seen.has(key)) {
          return false; // 重复，过滤掉
        }
        seen.add(key);
        return true;
      });
      console.log(`🧹 去重后剩余 ${codes.length} 条唯一数据`);
    }

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