import { prisma } from '@/lib/db';
import { MetadataRoute } from 'next';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.carcorporatecodes.com';

  // 获取所有品牌页面
  const brands = await prisma.brand.findMany({
    select: { slug: true, updatedAt: true },
  });

  // 获取所有 AI 生成的文章
  const articles = await prisma.aiQuery.findMany({
    select: { slug: true, updatedAt: true },
  });

  // 静态页面
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/ask`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
  ];

  // 品牌页面
  const brandPages = brands.map((brand) => ({
    url: `${baseUrl}/${brand.slug}`,
    lastModified: brand.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // 文章页面
  const articlePages = articles.map((article) => ({
    url: `${baseUrl}/ask/${article.slug}`,
    lastModified: article.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [...staticPages, ...brandPages, ...articlePages];
}
