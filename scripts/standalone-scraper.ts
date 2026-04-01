// 文件路径：scripts/standalone-scraper.ts
import { chromium } from 'playwright';
import OpenAI from 'openai';
import * as fs from 'fs';
import dotenv from 'dotenv';

// 加载环境变量 (读取你的 AI 密钥)
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const openai = new OpenAI({
  apiKey: process.env.VECTOR_ENGINE_API_KEY,
  baseURL: 'https://api.vectorengine.ai/v1',
});

async function runScraper(targetUrl: string) {
  console.log(`🚀 [独立爬虫] 开始抓取: ${targetUrl}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  try {
    console.log("⏳ 正在访问网页并提取文本...");
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000); 

    const pageText = await page.evaluate(() => {
      return document.body.innerText.replace(/\s+/g, ' ').trim();
    });
    
    console.log(`✅ 文本提取成功！共 ${pageText.length} 字。正在呼叫 AI...`);
    const safeText = pageText.substring(0, 15000); 

    const completion = await openai.chat.completions.create({
      model: "gemini-3.1-pro-preview",
      messages: [
        { 
          role: "system", 
          content: "你是一个数据清洗专家。请从以下文本中提取所有的租车折扣码。严格返回 JSON 数组格式：[{ \"brand\": \"Hertz/Avis等\", \"company\": \"企业名\", \"codeValue\": \"折扣码\", \"description\": \"说明\" }]。如果没有找到，返回空数组 []。" 
        },
        { role: "user", content: safeText }
      ],
      response_format: { type: "json_object" } 
    });

    const aiResponse = completion.choices[0].message.content || '{"data":[]}';
    let codes = [];
    try {
      const parsed = JSON.parse(aiResponse);
      codes = parsed.data || parsed.codes || parsed;
      if (!Array.isArray(codes)) codes = [parsed];
    } catch (e) {
      console.error("❌ AI 数据解析失败");
      return;
    }

    console.log(`💡 AI 提取完毕，共找到 ${codes.length} 条数据！`);

    // 🌟 核心改动：不再连数据库，直接写入本地 JSON 文件
    const outputPath = 'output_codes.json';
    fs.writeFileSync(outputPath, JSON.stringify(codes, null, 2), 'utf-8');
    
    console.log(`\n🎉 搞定！数据已安全保存到当前目录的 ${outputPath} 文件中。`);
    console.log(`你可以打开这个文件检查一下，确认无误后去 Admin 后台导入。`);

  } catch (error) {
    console.error(`❌ 抓取错误:`, error);
  } finally {
    await browser.close();
  }
}

// 目标网址
const testUrl = "https://www.flyertalk.com/forum/hertz-gold-plus-rewards/1336148-hertz-corporate-discount-codes-cdp-master-thread.html";
runScraper(testUrl);