import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import AiArticlesManager from '../components/AiArticlesManager';

export const dynamic = 'force-dynamic';

async function deleteArticleAction(formData: FormData) {
  'use server';

  const articleId = formData.get('articleId') as string;

  if (articleId) {
    await prisma.aiQuery.delete({
      where: { id: articleId },
    });
    revalidatePath('/admin/ai-articles');
    revalidatePath('/ask');
    revalidatePath('/sitemap.xml');
  }
}

async function updateArticleAction(formData: FormData) {
  'use server';

  const articleId = formData.get('articleId') as string;
  const seoTitle = formData.get('seoTitle') as string;
  const seoContent = formData.get('seoContent') as string;
  const aiSummary = formData.get('aiSummary') as string;

  if (articleId) {
    await prisma.aiQuery.update({
      where: { id: articleId },
      data: {
        seoTitle,
        seoContent,
        aiSummary,
      },
    });
    revalidatePath('/admin/ai-articles');
    revalidatePath(`/ask/${formData.get('slug')}`);
  }
}

export default async function AiArticlesPage() {
  const articles = await prisma.aiQuery.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">AI 文章管理</h2>
        <Link
          href="/ask"
          target="_blank"
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          去前台查看 →
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-bold leading-6 text-gray-900">所有 AI 生成文章</h3>
          <p className="text-sm text-gray-500 mt-1">管理 AI 生成的问答文章，可编辑或删除</p>
        </div>
        <AiArticlesManager
          articles={articles}
          deleteAction={deleteArticleAction}
          updateAction={updateArticleAction}
        />
      </div>
    </div>
  );
}
