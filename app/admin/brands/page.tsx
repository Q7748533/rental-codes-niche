import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import BrandManager from '../components/BrandManager';

export const dynamic = 'force-dynamic';

async function deleteBrandAction(formData: FormData) {
  'use server';

  const brandId = formData.get('brandId') as string;
  
  if (brandId) {
    await prisma.brand.delete({
      where: { id: brandId },
    });
    revalidatePath('/admin/brands');
    revalidatePath('/');
    revalidatePath('/sitemap.xml');
  }
}

export default async function BrandsPage() {
  const brands = await prisma.brand.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: { codes: true },
      },
    },
  });

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">品牌管理</h2>
      
      <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-bold leading-6 text-gray-900">所有品牌</h3>
          <p className="text-sm text-gray-500 mt-1">查看和管理所有品牌，删除品牌将同时删除其下的所有代码</p>
        </div>
        <div className="p-6">
          <BrandManager 
            brands={brands}
            deleteAction={deleteBrandAction}
          />
        </div>
      </div>
    </div>
  );
}
