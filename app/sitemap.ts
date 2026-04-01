// 文件路径：scripts/scraper.ts
import { chromium } from 'playwright';
import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';
import dotenv from 'dotenv';

// 1. 强制加载环境变量
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

// 2. 终极兼容写法：使用 require 彻底绕过模块解析冲突
// @ts-ignore
const { PrismaLibSQL } = require('@prisma/adapter-libsql');
// @ts-ignore
const { createClient } = require('@libsql/client');

// 3. 点火云端数据库
const libsql = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});
const adapter = new PrismaLibSQL(libsql);
const prisma = new PrismaClient({ adapter });

// 4. 初始化 AI
const openai = new OpenAI({
  apiKey: process.env.VECTOR_ENGINE_API_KEY,
  // baseURL: 'https://api.xty.app/v1', // 如果用中转接口把双斜杠删掉
});

// ...... (下面的 runScraper 函数部分保持不变) ......