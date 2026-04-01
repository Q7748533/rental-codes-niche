import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import CodesManager from '../components/CodesManager';

export const dynamic = 'force-dynamic';

async function deleteCodeAction(formData: FormData) {
  'use server';

  const codeId = formData.get('codeId') as string;

  if (codeId) {
    await prisma.code.delete({
      where: { id: codeId },
    });
    revalidatePath('/admin/codes');
  }
}

async function batchDeleteCodesAction(formData: FormData) {
  'use server';

  const codeIdsStr = formData.get('codeIds') as string;

  if (codeIdsStr) {
    const codeIds = codeIdsStr.split(',');
    await prisma.code.deleteMany({
      where: {
        id: {
          in: codeIds,
        },
      },
    });
    revalidatePath('/admin/codes');
  }
}

export default async function CodesPage() {
  const allCodes = await prisma.code.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      brand: true,
      company: true,
    },
  });

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">代码管理</h2>
      
      <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-bold leading-6 text-gray-900">所有代码</h3>
          <p className="text-sm text-gray-500 mt-1">勾选记录可进行批量删除</p>
        </div>
        <CodesManager 
          codes={allCodes} 
          deleteAction={deleteCodeAction}
          batchDeleteAction={batchDeleteCodesAction}
        />
      </div>
    </div>
  );
}
