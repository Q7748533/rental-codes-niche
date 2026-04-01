import { MetadataRoute } from 'next';
import { prisma } from '@/lib/db';

// 强制动态渲染，避免构建时查询数据库
export const dynamic = 'force-dynamic';

const BASE_URL = 'https://carcorporatecodes.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 1. 静态页面
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/tips`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
  ];

  // 2. 品牌页面
  const brands = await prisma.brand.findMany({
    select: { slug: true, updatedAt: true },
  });
  
  const brandRoutes: MetadataRoute.Sitemap = brands.map((brand) => ({
    url: `${BASE_URL}/${brand.slug}`,
    lastModified: brand.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  // 3. AI 生成的文章页面
  const articles = await prisma.aiQuery.findMany({
    select: { slug: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
  
  const articleRoutes: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${BASE_URL}/ask/${article.slug}`,
    lastModified: article.createdAt,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  // 合并所有路由
  return [...staticRoutes, ...brandRoutes, ...articleRoutes];
}
