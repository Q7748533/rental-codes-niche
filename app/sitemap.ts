import { prisma } from '@/lib/db';
import { MetadataRoute } from 'next';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.carcorporatecodes.com';

  // 1. 静态核心页面
  const staticPages = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 1.0 },
    { url: `${baseUrl}/ask`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.9 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.5 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.5 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.5 },
  ];

  // 2. 品牌枢纽页 (Brand Hubs)
  const brands = await prisma.brand.findMany({
    select: { slug: true, updatedAt: true },
  });
  const brandPages = brands.map((brand) => ({
    url: `${baseUrl}/${brand.slug}`,
    lastModified: brand.updatedAt || new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }));

  // 🚀 3. 新增：公司枢纽页 (Organization Hubs)
  const companies = await prisma.company.findMany({
    select: { slug: true, updatedAt: true },
  });
  const companyPages = companies.map((company) => ({
    url: `${baseUrl}/organization/${company.slug}`,
    lastModified: company.updatedAt || new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // 🚀 4. 核心变现节点：具体代码页面 (Code Spokes)
  const codes = await prisma.code.findMany({
    include: { brand: true, company: true }
  });
  const codePages = codes.map((code) => ({
    url: `${baseUrl}/codes/${code.brand.slug}-${code.company.slug}`,
    lastModified: code.updatedAt || new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8, // 给予变现页极高权重
  }));

  // 5. AI 长尾文章页 (AI Guides)
  const articles = await prisma.aiQuery.findMany({
    where: {
      slug: { not: { startsWith: 'pending-' } } // 🚀 物理隔离：绝不把出错的占位符提交给 Google
    },
    select: { slug: true, updatedAt: true, createdAt: true },
  });
  const articlePages = articles.map((article) => ({
    // 确保 URL 格式干净且以 .html 结尾
    url: `${baseUrl}/ask/${article.slug.replace(/\.html$/, '')}.html`,
    lastModified: article.updatedAt || article.createdAt,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  // 合并五大矩阵！
  return [
    ...staticPages,
    ...brandPages,
    ...companyPages,
    ...codePages,
    ...articlePages
  ];
}
