import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import { requireAdminAuth } from '@/lib/auth';
import BatchDeleteForm from './components/BatchDeleteForm';
import PublicDealsManager from './components/PublicDealsManager';
import LogoutButton from './components/LogoutButton';
import JsonImportForm from './components/JsonImportForm';

// 强制动态渲染，避免构建时查询数据库
export const dynamic = 'force-dynamic';

// 单个删除
async function deleteCodeAction(formData: FormData) {
  'use server';

  const codeId = formData.get('codeId') as string;

  if (codeId) {
    await prisma.code.delete({
      where: { id: codeId },
    });
    revalidatePath('/admin');
  }
}

// 批量删除
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
    revalidatePath('/admin');
  }
}

// Public Deals 管理操作
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
  revalidatePath('/admin');
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
  revalidatePath('/admin');
  revalidatePath('/');
}

async function deletePublicDealAction(formData: FormData) {
  'use server';

  const id = formData.get('id') as string;
  await prisma.publicDeal.delete({
    where: { id },
  });
  revalidatePath('/admin');
  revalidatePath('/');
}

export default async function AdminDashboard() {
  // 验证管理员登录状态，未登录则重定向到登录页
  await requireAdminAuth();
  
  const [totalCodes, totalBrands, totalCompanies, totalPublicDeals] = await Promise.all([
    prisma.code.count(),
    prisma.brand.count(),
    prisma.company.count(),
    prisma.publicDeal.count(),
  ]);

  const allCodes = await prisma.code.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      brand: true,
      company: true,
    },
  });

  const publicDeals = await prisma.publicDeal.findMany({
    orderBy: { sortOrder: 'asc' },
  });

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <nav className="bg-gray-900 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <span className="font-extrabold text-xl tracking-wider">Car Corporate Codes 管理后台</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                查看前台网站 &rarr;
              </Link>
              <LogoutButton />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">总代码数</h3>
            <p className="mt-2 text-3xl font-extrabold text-gray-900">{totalCodes}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">品牌数量</h3>
            <p className="mt-2 text-3xl font-extrabold text-gray-900">{totalBrands}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">公司数量</h3>
            <p className="mt-2 text-3xl font-extrabold text-gray-900">{totalCompanies}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">公开优惠</h3>
            <p className="mt-2 text-3xl font-extrabold text-gray-900">{totalPublicDeals}</p>
          </div>
        </div>

        {/* Public Deals 管理 */}
        <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200 mb-8">
          <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-bold leading-6 text-gray-900">首页公开优惠链接管理</h3>
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

        {/* JSON 导入 */}
        <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200 mb-8">
          <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-bold leading-6 text-gray-900">导入代码数据</h3>
            <p className="text-sm text-gray-500 mt-1">上传 JSON 文件批量导入租车优惠代码</p>
          </div>
          <div className="p-6">
            <JsonImportForm />
          </div>
        </div>

        {/* 数据表格 */}
        <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
          <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center bg-gray-50">
            <div>
              <h3 className="text-lg font-bold leading-6 text-gray-900">数据库记录</h3>
              <p className="text-sm text-gray-500 mt-1">勾选记录可进行批量删除</p>
            </div>
          </div>

          <BatchDeleteForm 
            codes={allCodes} 
            deleteAction={deleteCodeAction}
            batchDeleteAction={batchDeleteCodesAction}
          />
        </div>
      </main>
    </div>
  );
}
