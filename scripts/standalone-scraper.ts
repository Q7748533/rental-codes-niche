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

async function runScraper(targetUrl: string) {
  console.log(`\n🚀 [独立爬虫] 开始抓取: ${targetUrl}`);

  // 使用真实浏览器模式以穿透防火墙
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
    console.log("⏳ 正在访问网页...");
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    console.log("🛡️ 遇到高防盾，强制等待 10 秒钟。如果弹出验证码，请迅速用鼠标点击...");
    await page.waitForTimeout(10000); 

    const pageText = await page.evaluate(() => {
      return document.body.innerText.replace(/\s+/g, ' ').trim();
    });
    
    console.log(`✅ 文本提取成功！共 ${pageText.length} 字。正在呼叫 AI 进行深度特征提取...`);
    const safeText = pageText.substring(0, 18000); 

    // 🌟 核心升级：强化的 AI 提取指令
    const completion = await openai.chat.completions.create({
      model: "gemini-3.1-pro-preview",
      messages: [
        { 
          role: "system", 
          content: `你是一个专业的租车行业数据分析师。请从提供的文本中提取租车折扣码，并严格按照以下 JSON 格式返回。

          数据结构要求：
          [
            {
              "brand": "租车公司名称 (如 Hertz, Avis, Enterprise)",
              "company": "提供折扣的组织名称 (如 IBM, AAA, Santa Clara University)",
              "codeValue": "具体的 CDP 或 PC 代码内容",
              "description": "折扣力度及适用条件的简短说明",
              "codeType": "分类判断：如果是员工专用/需查工牌则填 'Business'；如果是校友/协会/普通大众可用则填 'Leisure'",
              "source": "来源分类：填 'Employee', 'Public', 'Member' 或 'Association' 之一"
            }
          ]

          推理规则：
          1. 如果提到 'Employee', 'Staff', 'Corporate rate'，codeType 选 'Business'。
          2. 如果提到 'Alumni', 'Student', 'University personal use', 'Association member'，codeType 选 'Leisure'。
          3. 如果描述中提到 'ID required' 或 'Verification needed'，请在 description 中注明。
          
          注意：仅返回 JSON 对象，不要包含任何解释文字。`
        },
        { role: "user", content: safeText }
      ],
      response_format: { type: "json_object" } 
    });

    const aiResponse = completion.choices[0].message.content || '{"data":[]}';
    let codes = [];
    try {
      const parsed = JSON.parse(aiResponse);
      // 兼容多种可能的 JSON 包裹格式
      codes = parsed.data || parsed.codes || (Array.isArray(parsed) ? parsed : Object.values(parsed)[0]);
      if (!Array.isArray(codes)) codes = [parsed];
    } catch (e) {
      console.error("❌ AI 数据解析失败，原始返回内容：", aiResponse);
      return;
    }

    console.log(`💡 AI 提取完毕，共找到 ${codes.length} 条带特征的代码！`);

    const outputPath = 'output_codes.json';
    fs.writeFileSync(outputPath, JSON.stringify(codes, null, 2), 'utf-8');
    
    console.log(`\n🎉 搞定！数据已保存至 ${outputPath}`);
    console.log(`数据预览：第一个提取到的是 [${codes[0]?.company}] 的 ${codes[0]?.codeValue} (${codes[0]?.codeType})\n`);

  } catch (error) {
    console.error(`❌ 抓取错误:`, error);
  } finally {
    await browser.close();
  }
}

async function main() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  console.log("=========================================");
  console.log("🤖 智能租车折扣码特征提取爬虫 (V2.0)");
  console.log("=========================================");

  const answer = await rl.question('\n🔗 请输入目标网址: ');
  const targetUrl = answer.trim();

  if (!targetUrl || !targetUrl.startsWith('http')) {
    console.log('\n❌ 错误: 网址格式不正确\n');
    rl.close();
    process.exit(1);
  }

  rl.close();
  await runScraper(targetUrl);
}

main();