import { chromium } from 'playwright';
import OpenAI from 'openai';
import * as fs from 'fs';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const openai = new OpenAI({
  apiKey: process.env.VECTOR_ENGINE_API_KEY,
  baseURL: 'https://api.vectorengine.ai/v1',
});

// --- 配置待抓取的机场列表 ---
// 建议：你可以把这个列表单独存成 airports_to_crawl.json
const TARGET_AIRPORTS = [
  { iata: 'SIN', url: 'https://www.changiairport.com/en/airport-guide/facilities-and-services.html' },
  { iata: 'DXB', url: 'https://www.dubaiairports.ae/before-you-fly/at-the-airport/showers' },
  { iata: 'LHR', url: 'https://www.heathrow.com/at-the-airport/terminal-facilities/showers' },
  // 可以在这里无限添加...
];

/**
 * PDF 文字提取引擎
 */
async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const uint8Array = new Uint8Array(buffer);
  const loadingTask = pdfjs.getDocument({ data: uint8Array });
  const pdfDocument = await loadingTask.promise;
  
  let fullText = '';
  for (let i = 1; i <= pdfDocument.numPages; i++) {
    const page = await pdfDocument.getPage(i);
    const textContent = await page.getTextContent();
    fullText += textContent.items.map((item: any) => item.str).join(' ') + '\n';
  }
  return fullText;
}

/**
 * 核心抓取与 AI 建模逻辑
 */
async function processAirport(iata: string, url: string) {
  console.log(`\n🛫 [Airport Matrix Scraper] 正在处理: ${iata} -> ${url}`);

  let contentText = '';
  const isPdf = url.split('?')[0].toLowerCase().endsWith('.pdf');

  if (isPdf) {
    try {
      const response = await fetch(url);
      const buffer = Buffer.from(await response.arrayBuffer());
      contentText = await extractTextFromPdf(buffer);
      console.log(`✅ PDF 解析成功 (${contentText.length} 字)`);
    } catch (err) {
      console.error(`❌ PDF 下载失败: ${iata}`, err);
      return null;
    }
  } else {
    const browser = await chromium.launch({ 
      headless: true, 
      args: ['--disable-blink-features=AutomationControlled'] 
    });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();

    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
      await page.waitForTimeout(3000); // 等待 JS 加载完成
      contentText = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').trim());
      console.log(`✅ 网页抓取成功 (${contentText.length} 字)`);
    } catch (err) {
      console.error(`❌ 网页加载失败: ${iata}`, err);
      return null;
    } finally {
      await browser.close();
    }
  }

  // --- AI 提取环节 ---
  try {
    console.log(`🤖 呼叫 Gemini 3.1 Pro 建模 [${iata}]...`);
    
    const completion = await openai.chat.completions.create({
      model: "gemini-3.1-pro-preview",
      messages: [
        { 
          role: "system", 
          content: `你是一个全球航空专家。请从文本中提取机场基础设施数据。
          
          【严格输出格式】：返回一个 JSON 对象，包含以下字段：
          1. showerData: { "Price": string, "Locations": string, "Operating_Hours": string, "Notes": string }
          2. sleepData: { "Pods": string, "Transit_Hotel": string, "Quiet_Zones": string, "Notes": string }
          3. luggageData: { "Pricing": string, "Storage_Type": string, "Locations": string }
          4. transitData: Array<{ "method": string, "duration": string, "price": string }>

          【提取准则】：
          - 没找到的信息填 "Contact airport for details"。
          - 价格保留原始货币和USD。
          - 位置要具体到航站楼(Terminal)和登机口(Gate)。
          - 语言统一使用英语。`
        },
        { role: "user", content: `【内容文本】：\n${contentText.substring(0, 20000)}` }
      ],
      response_format: { type: "json_object" }
    });

    const aiResponse = JSON.parse(completion.choices[0].message.content || '{}');

    // 格式化为 Prisma 兼容的对象 (JSON 字段转为字符串)
    return {
      iata: iata.toUpperCase(),
      showerData: JSON.stringify(aiResponse.showerData),
      sleepData: JSON.stringify(aiResponse.sleepData),
      luggageData: JSON.stringify(aiResponse.luggageData),
      transitData: JSON.stringify(aiResponse.transitData),
      lastUpdate: new Date().toISOString()
    };

  } catch (error) {
    console.error(`❌ AI 处理异常 [${iata}]:`, error);
    return null;
  }
}

/**
 * 主程序
 */
async function main() {
  const results = [];
  
  for (const item of TARGET_AIRPORTS) {
    const data = await processAirport(item.iata, item.url);
    if (data) {
      results.push(data);
      // 每完成一个存一次，防止程序崩溃前功尽弃
      fs.writeFileSync('airport_data_batch.json', JSON.stringify(results, null, 2));
    }
    // 礼貌延迟，防止被封 IP
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log(`\n🎉 全部任务完成！共成功采集 ${results.length} 个机场数据。`);
  console.log(`💡 数据已保存至: airport_data_batch.json`);
}

main().catch(console.error);