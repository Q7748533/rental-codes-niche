# Car Corporate Codes - 开发手册

> 版本: 1.0.0 | 最后更新: 2026-04-05

---

## 📋 目录

1. [项目概述](#1-项目概述)
2. [技术架构](#2-技术架构)
3. [开发环境配置](#3-开发环境配置)
4. [数据库设计](#4-数据库设计)
5. [项目结构](#5-项目结构)
6. [开发规范](#6-开发规范)
7. [API 接口文档](#7-api-接口文档)
8. [部署流程](#8-部署流程)
9. [SEO 规范](#9-seo-规范)
10. [故障排查](#10-故障排查)

---

## 1. 项目概述

### 1.1 项目简介
Car Corporate Codes 是一个专注于汽车租赁公司折扣代码的聚合网站，提供 Hertz、Enterprise、Avis 等主要租车品牌的公司折扣代码查询服务。

### 1.2 核心功能
- 🔍 公司折扣代码搜索与查询
- 🏢 按租车品牌浏览代码
- 🏛️ 按公司/组织浏览代码
- 🤖 AI 租车指南生成
- 📊 管理员后台（代码管理、数据分析）
- 📱 响应式设计，支持移动端

### 1.3 目标用户
- 商务出差人员
- 租车优惠搜索者
- 企业员工

---

## 2. 技术架构

### 2.1 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| **框架** | Next.js | 16.2.1 |
| **语言** | TypeScript | 6.0.2 |
| **前端** | React | 19.2.4 |
| **样式** | Tailwind CSS | 4.2.2 |
| **数据库** | SQLite (Prisma) | 6.19.2 |
| **部署** | Vercel | - |
| **AI** | OpenAI API | 6.33.0 |

### 2.2 架构图

```
┌─────────────────────────────────────────────────────────┐
│                      用户层 (Client)                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │   首页      │  │  代码详情页  │  │   AI 问答页     │  │
│  └─────────────┘  └─────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
┌─────────────────────────────────────────────────────────┐
│                   Next.js App Router                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │  SSR 页面   │  │  API Routes │  │  Static Export  │  │
│  └─────────────┘  └─────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
┌─────────────────────────────────────────────────────────┐
│                    数据层 (Prisma)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │   SQLite    │  │   Turso     │  │   Local Dev     │  │
│  └─────────────┘  └─────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 2.3 核心依赖说明

```json
{
  "@prisma/client": "ORM 数据库客户端",
  "@libsql/client": "Turso 数据库连接",
  "openai": "AI 内容生成",
  "playwright": "网页抓取（预留）",
  "pdf-parse": "PDF 解析（预留）"
}
```

---

## 3. 开发环境配置

### 3.1 环境要求
- Node.js >= 18.0.0
- npm >= 9.0.0
- Git

### 3.2 本地开发 setup

```bash
# 1. 克隆仓库
git clone https://github.com/Q7748533/rental-codes-niche.git
cd rental-codes-niche

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env.local

# 4. 初始化数据库
npx prisma migrate dev
npx prisma generate

# 5. 启动开发服务器
npm run dev
```

### 3.3 环境变量配置

创建 `.env.local` 文件：

```env
# 数据库配置
DATABASE_URL="file:./prisma/dev.db"
# 生产环境使用 Turso
# DATABASE_URL="libsql://..."
# TURSO_AUTH_TOKEN="..."

# OpenAI API（用于 AI 问答功能）
OPENAI_API_KEY="sk-..."

# 管理员认证
ADMIN_USERNAME="admin"
ADMIN_PASSWORD_HASH="$2b$10$..."  # bcrypt 哈希

# 可选：Google AdSense
ADSENSE_PUBLISHER_ID="ca-pub-..."

# 可选：Google Analytics
GA_MEASUREMENT_ID="G-..."
```

### 3.4 数据库初始化

```bash
# 开发环境（SQLite）
npx prisma migrate dev --name init

# 生产环境（Turso）
# 1. 安装 Turso CLI
npm install -g @tursodatabase/turso

# 2. 登录
npx turso auth login

# 3. 创建数据库
npx turso db create carcodes-db

# 4. 获取连接信息
npx turso db show carcodes-db
npx turso db tokens create carcodes-db
```

---

## 4. 数据库设计

### 4.1 ER 图

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   Brand     │       │    Code     │       │   Company   │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id (PK)     │◄──────┤ id (PK)     │──────►│ id (PK)     │
│ name (UQ)   │       │ codeValue   │       │ name (UQ)   │
│ slug (UQ)   │       │ description │       │ slug (UQ)   │
│ defaultUrl  │       │ isValid     │       │ industry    │
│ createdAt   │       │ codeType    │       │ createdAt   │
│ updatedAt   │       │ source      │       │ updatedAt   │
└─────────────┘       │ brandId(FK) │       └─────────────┘
                      │ companyId(FK)│
                      │ createdAt   │
                      │ updatedAt   │
                      └─────────────┘

┌─────────────┐       ┌─────────────┐
│  AiQuery    │       │ PublicDeal  │
├─────────────┤       ├─────────────┤
│ id (PK)     │       │ id (PK)     │
│ slug (UQ)   │       │ title       │
│ userPrompt  │       │ description │
│ aiSummary   │       │ linkUrl     │
│ seoTitle    │       │ buttonText  │
│ seoContent  │       │ isActive    │
│ viewCount   │       │ sortOrder   │
│ createdAt   │       │ createdAt   │
│ updatedAt   │       │ updatedAt   │
└─────────────┘       └─────────────┘
```

### 4.2 模型说明

#### Brand（租车品牌）
| 字段 | 类型 | 说明 |
|------|------|------|
| name | String | 品牌名称，如 "Hertz" |
| slug | String | URL 友好标识，如 "hertz" |
| defaultUrl | String? | 官网链接 |

#### Company（公司/组织）
| 字段 | 类型 | 说明 |
|------|------|------|
| name | String | 公司名称 |
| slug | String | URL 标识 |
| industry | String? | 行业分类 |

#### Code（折扣代码）
| 字段 | 类型 | 说明 |
|------|------|------|
| codeValue | String | 代码值，如 "CDP 12345" |
| codeType | String | 类型：Business/Public |
| isValid | Boolean | 是否有效 |
| source | String? | 来源说明 |

#### AiQuery（AI 生成内容）
| 字段 | 类型 | 说明 |
|------|------|------|
| slug | String | URL 标识 |
| seoTitle | String | SEO 标题 |
| seoContent | String | 文章内容 |
| viewCount | Int | 浏览次数 |

### 4.3 常用数据库操作

```typescript
// 查询品牌及其代码
const brand = await prisma.brand.findUnique({
  where: { slug: 'hertz' },
  include: {
    codes: {
      include: { company: true }
    }
  }
});

// 查询公司及其代码
const company = await prisma.company.findUnique({
  where: { slug: 'ibm' },
  include: {
    codes: {
      include: { brand: true }
    }
  }
});

// 搜索代码
const codes = await prisma.code.findMany({
  where: {
    OR: [
      { codeValue: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
      { company: { name: { contains: query, mode: 'insensitive' } } }
    ]
  },
  include: { brand: true, company: true }
});
```

---

## 5. 项目结构

```
rental-codes-niche/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # 首页
│   ├── layout.tsx                # 根布局
│   ├── loading.tsx               # 全局加载状态
│   ├── globals.css               # 全局样式
│   ├── sitemap.ts                # 动态站点地图
│   ├── robots.ts                 # 爬虫规则
│   │
│   ├── [brand]/                  # 品牌详情页 (动态路由)
│   │   └── page.tsx
│   │
│   ├── codes/
│   │   └── [slug]/               # 代码详情页
│   │       └── page.tsx
│   │
│   ├── organization/
│   │   └── [slug]/               # 公司详情页
│   │       └── page.tsx
│   │
│   ├── ask/                      # AI 问答功能
│   │   ├── page.tsx              # Ask 首页
│   │   └── [...slug]/            # AI 生成文章页
│   │       └── page.tsx
│   │
│   ├── search/                   # 搜索页
│   │   └── page.tsx
│   │
│   ├── about/                    # 关于页面
│   ├── tips/                     # 使用技巧
│   ├── privacy/                  # 隐私政策
│   ├── terms/                    # 服务条款
│   │
│   ├── admin/                    # 管理后台
│   │   ├── page.tsx              # 仪表盘
│   │   ├── layout.tsx            # 管理员布局
│   │   ├── codes/                # 代码管理
│   │   ├── brands/               # 品牌管理
│   │   ├── ai-articles/          # AI 文章管理
│   │   ├── deals/                # 优惠管理
│   │   ├── adsense/              # 广告配置
│   │   ├── analytics/            # 分析配置
│   │   └── components/           # 管理组件
│   │
│   ├── api/                      # API 路由
│   │   ├── codes/route.ts        # 代码录入 API
│   │   ├── ask/route.ts          # AI 问答 API
│   │   ├── admin/                # 管理 API
│   │   └── ...
│   │
│   └── (public)/                 # 公开路由组
│       └── admin/login/          # 登录页
│
├── components/                   # React 组件
│   ├── ui/                       # UI 组件
│   ├── MobileNav.tsx             # 移动端导航
│   ├── CopyCodeButton.tsx        # 复制代码按钮
│   ├── AskAiWidget.tsx           # AI 问答组件
│   └── ...
│
├── lib/                          # 工具库
│   ├── db.ts                     # Prisma 客户端
│   ├── utils.ts                  # 工具函数
│   └── constants.ts              # 常量定义
│
├── prisma/
│   ├── schema.prisma             # 数据库模型
│   └── dev.db                    # 开发数据库
│
├── public/                       # 静态资源
│   └── ...
│
├── scripts/                      # 脚本工具
│   └── ...
│
├── types/                        # TypeScript 类型
│   └── ...
│
├── .env.local                    # 本地环境变量
├── .env.production               # 生产环境变量
├── next.config.js                # Next.js 配置
├── tailwind.config.ts            # Tailwind 配置
├── tsconfig.json                 # TypeScript 配置
└── package.json
```

---

## 6. 开发规范

### 6.1 代码风格

#### TypeScript 规范
```typescript
// ✅ 使用显式类型
interface CodeData {
  id: string;
  codeValue: string;
  brand: Brand;
}

// ✅ 使用 async/await
async function fetchData(): Promise<CodeData[]> {
  return await prisma.code.findMany();
}

// ❌ 避免 any
data: any  // 不推荐

// ✅ 使用 unknown + 类型守卫
function processData(data: unknown): CodeData {
  if (isCodeData(data)) {
    return data;
  }
  throw new Error('Invalid data');
}
```

#### React 组件规范
```typescript
// ✅ 使用函数组件 + 显式返回类型
interface Props {
  code: Code;
  onCopy?: () => void;
}

export function CodeCard({ code, onCopy }: Props): JSX.Element {
  return (
    <div className="p-4 border rounded-lg">
      <h3>{code.codeValue}</h3>
    </div>
  );
}

// ✅ Server Component（默认）
export default async function Page() {
  const data = await prisma.code.findMany();
  return <CodeList codes={data} />;
}

// ✅ Client Component（需要交互时）
'use client';

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  // ...
}
```

### 6.2 文件命名规范

| 类型 | 命名方式 | 示例 |
|------|----------|------|
| 页面 | page.tsx | app/codes/[slug]/page.tsx |
| 布局 | layout.tsx | app/admin/layout.tsx |
| 组件 | PascalCase.tsx | components/CodeCard.tsx |
| 工具函数 | camelCase.ts | lib/utils.ts |
| 类型定义 | types.ts / interface.ts | types/code.ts |
| API 路由 | route.ts | app/api/codes/route.ts |

### 6.3 样式规范

#### Tailwind CSS 使用原则
```tsx
// ✅ 使用语义化类名
<div className="bg-white rounded-lg shadow-md p-6">

// ✅ 响应式前缀（移动优先）
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">

// ✅ 状态变体
<button className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800">

// ✅ 使用 @apply 提取重复样式（仅在 globals.css）
@layer components {
  .btn-primary {
    @apply bg-blue-600 text-white px-4 py-2 rounded-lg;
  }
}
```

### 6.4 SEO 组件规范

```typescript
// ✅ 每个页面必须包含完整的 Metadata
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getData(slug);
  
  return {
    title: `${data.name} Corporate Codes 2026`,
    description: `Save up to 25% with ${data.name} corporate discount codes.`,
    alternates: {
      canonical: `https://www.carcorporatecodes.com/codes/${slug}`,
    },
    openGraph: {
      title: `${data.name} Corporate Codes`,
      description: `Verified discount codes for ${data.name}`,
      url: `https://www.carcorporatecodes.com/codes/${slug}`,
    },
  };
}

// ✅ 添加 JSON-LD 结构化数据
function JsonLd({ data }: { data: CodeData }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Offer',
    name: `${data.brand.name} ${data.company.name} Code`,
    // ...
  };
  
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
```

### 6.5 无障碍（A11y）规范

```tsx
// ✅ 图片必须包含 alt
<img src="logo.png" alt="Car Corporate Codes Logo" />

// ✅ 表单元素关联 label
<label htmlFor="search">Search codes</label>
<input id="search" aria-label="Search discount codes" />

// ✅ 面包屑语义化
<nav aria-label="Breadcrumb">
  <ol className="flex items-center space-x-2">
    <li><Link href="/">Home</Link></li>
    <li className="text-gray-400">/</li>
    <li className="text-gray-900">Current Page</li>
  </ol>
</nav>

// ✅ 地标角色
<header role="banner" aria-label="Site header">
<main role="main" aria-label="Page content">
<nav role="navigation" aria-label="Main navigation">
<footer role="contentinfo" aria-label="Site footer">
```

---

## 7. API 接口文档

### 7.1 公共 API

#### POST /api/codes
录入新的折扣代码（用于数据导入）。

**请求体：**
```json
{
  "brandName": "Hertz",
  "companyName": "IBM",
  "codeValue": "CDP 12345",
  "description": "Save up to 20% on business rentals"
}
```

**响应：**
```json
{
  "success": true,
  "message": "代码录入成功！",
  "data": { /* Code object */ }
}
```

#### POST /api/ask
AI 问答接口，生成租车指南。

**请求体：**
```json
{
  "query": "How to get Hertz corporate discount?"
}
```

**响应：**
```json
{
  "success": true,
  "slug": "how-to-get-hertz-corporate-discount",
  "title": "How to Get Hertz Corporate Discount: Complete Guide",
  "content": "..."
}
```

### 7.2 管理 API

所有管理 API 需要管理员身份验证（Cookie: admin_session）。

| 端点 | 方法 | 说明 |
|------|------|------|
| /api/admin/login | POST | 管理员登录 |
| /api/admin/logout | POST | 管理员登出 |
| /api/admin/import-codes | POST | 批量导入代码 |
| /api/admin/adsense | GET/POST | AdSense 配置 |
| /api/admin/analytics | GET/POST | Analytics 配置 |

---

## 8. 部署流程

### 8.1 Vercel 部署

```bash
# 1. 安装 Vercel CLI
npm i -g vercel

# 2. 登录
vercel login

# 3. 部署（开发预览）
vercel

# 4. 部署（生产环境）
vercel --prod
```

### 8.2 环境变量配置（Vercel Dashboard）

必需变量：
```
DATABASE_URL=libsql://...
TURSO_AUTH_TOKEN=...
OPENAI_API_KEY=sk-...
ADMIN_PASSWORD_HASH=$2b$10$...
```

可选变量：
```
ADSENSE_PUBLISHER_ID=ca-pub-...
GA_MEASUREMENT_ID=G-...
```

### 8.3 数据库迁移（生产）

```bash
# 1. 本地导出
sqlite3 prisma/dev.db .dump > dump.sql

# 2. Turso 导入
npx turso db shell carcodes-db < dump.sql

# 3. 验证
npx turso db shell carcodes-db
> SELECT name FROM sqlite_master WHERE type='table';
```

### 8.4 部署检查清单

- [ ] 所有环境变量已配置
- [ ] 数据库已迁移到生产环境
- [ ] 管理员密码已设置
- [ ] OpenAI API Key 有效
- [ ] 域名 DNS 指向 Vercel
- [ ] SSL 证书自动配置
- [ ] sitemap.xml 可访问
- [ ] robots.txt 配置正确

---

## 9. SEO 规范

### 9.1 URL 结构

```
/                          # 首页
/hertz                     # 品牌页
/codes/hertz-ibm           # 代码详情页
/organization/ibm          # 公司页
/ask/how-to-...            # AI 文章页
/search?q=query            # 搜索页
```

### 9.2 Meta 标签规范

```html
<title>{Page Title} | Car Rental Corporate Codes 2026</title>
<meta name="description" content="150-160字符的描述">
<link rel="canonical" href="https://www.carcorporatecodes.com/...">
```

### 9.3 结构化数据

每个页面必须包含对应的 JSON-LD：
- 首页: WebSite + Organization
- 品牌页: ItemList + BreadcrumbList
- 代码页: Offer + BreadcrumbList
- 公司页: Organization + BreadcrumbList
- AI 文章: Article + FAQPage + BreadcrumbList

### 9.4 内容规范

#### H1/H2 信息密度原则
- 每个词必须承载信息，去除废话
- 避免重复关键词堆砌
- 使用具体实体名称（品牌、公司）

```
❌ "Browse Codes by Rental Brand"
✅ "Rental Brands with Corporate Codes"

❌ "How to Use Car Rental Corporate Codes"
✅ "How Corporate Codes Work"

❌ "Frequently Asked Questions"
✅ "{Brand} Code FAQ"
```

---

## 10. 故障排查

### 10.1 常见问题

#### 数据库连接失败
```
Error: Can't reach database server
```
**解决：**
1. 检查 `DATABASE_URL` 和 `TURSO_AUTH_TOKEN`
2. 验证 Turso 数据库状态：`npx turso db list`
3. 重新生成 Token：`npx turso db tokens create carcodes-db`

#### Prisma Client 错误
```
Error: @prisma/client did not initialize
```
**解决：**
```bash
npm run postinstall
# 或
npx prisma generate
```

#### 构建失败
```
Error: Dynamic server usage
```
**解决：**
- 检查页面是否使用了 Dynamic API（headers/cookies）
- 添加 `export const dynamic = 'force-static'` 或 `force-dynamic`

### 10.2 调试技巧

```typescript
// 启用 Prisma 日志
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Next.js 调试模式
next dev --turbo

// 查看构建详情
next build --debug
```

### 10.3 性能优化

```typescript
// 1. 数据库查询优化
const data = await prisma.code.findMany({
  where: { isValid: true },
  take: 100,        // 限制数量
  skip: 0,          // 分页
  include: {
    brand: true,
    company: true,
  },
});

// 2. 使用 React Suspense
<Suspense fallback={<Loading />}>
  <CodeList />
</Suspense>

// 3. 图片优化
import Image from 'next/image';
<Image src="/logo.png" width={200} height={50} alt="Logo" />

// 4. 静态导出配置
// next.config.js
module.exports = {
  output: 'export',
  distDir: 'dist',
};
```

---

## 附录

### A. 常用命令速查

```bash
# 开发
npm run dev              # 启动开发服务器
npm run build            # 构建生产版本
npm run start            # 启动生产服务器
npm run lint             # 运行 ESLint

# 数据库
npx prisma migrate dev   # 创建迁移
npx prisma db push       # 推送 schema 到数据库
npx prisma studio        # 打开数据库 GUI
npx prisma generate      # 生成客户端

# Turso
npx turso db list        # 列出数据库
npx turso db shell       # 打开 SQL shell
npx turso db tokens create  # 创建访问令牌
```

### B. 外部服务

| 服务 | 用途 | 链接 |
|------|------|------|
| Vercel | 部署托管 | https://vercel.com |
| Turso | 云端数据库 | https://turso.tech |
| OpenAI | AI 内容生成 | https://platform.openai.com |
| Google Search Console | SEO 监控 | https://search.google.com/search-console |

### C. 参考资源

- [Next.js 文档](https://nextjs.org/docs)
- [Prisma 文档](https://www.prisma.io/docs)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [Schema.org](https://schema.org)

---

**维护者：** Car Corporate Codes Team  
**最后更新：** 2026-04-05
