import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import PublicDealsManager from '../components/PublicDealsManager';

export const dynamic = 'force-dynamic';

async function createPublicDealAction(formData: FormData) {
  'use server';

  await prisma.publicDeal.create({
    data: {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      linkUrl: formData.get('linkUrl') as string,
      buttonText: formData.get('buttonText') as string,
      sortOrder: parseInt(formData.get('sortOrder') as string) || 0,
    },
  });
  revalidatePath('/admin/deals');
  revalidatePath('/');
}

async function updatePublicDealAction(formData: FormData) {
  'use server';

  const id = formData.get('id') as string;
  await prisma.publicDeal.update({
    where: { id },
    data: {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      linkUrl: formData.get('linkUrl') as string,
      buttonText: formData.get('buttonText') as string,
      sortOrder: parseInt(formData.get('sortOrder') as string) || 0,
      isActive: formData.get('isActive') === 'on',
    },
  });
  revalidatePath('/admin/deals');
  revalidatePath('/');
}

async function deletePublicDealAction(formData: FormData) {
  'use server';

  const id = formData.get('id') as string;
  await prisma.publicDeal.delete({
    where: { id },
  });
  revalidatePath('/admin/deals');
  revalidatePath('/');
}

export default async function DealsPage() {
  const publicDeals = await prisma.publicDeal.findMany({
    orderBy: { sortOrder: 'asc' },
  });

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">首页优惠链接管理</h2>
      
      <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-bold leading-6 text-gray-900">公开优惠链接</h3>
          <p className="text-sm text-gray-500 mt-1">管理首页 "No Corporate Code? Use These Public Deals" 区域显示的链接</p>
        </div>
        <div className="p-6">
          <PublicDealsManager 
            deals={publicDeals}
            createAction={createPublicDealAction}
            updateAction={updatePublicDealAction}
            deleteAction={deletePublicDealAction}
          />
        </div>
      </div>
    </div>
  );
}
