import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

interface ImportCodeItem {
  brand: string;
  company: string;
  codeValue: string;
  description?: string;
  codeType?: string;
  source?: string;
}

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
  details: {
    brand: string;
    company: string;
    codeValue: string;
    status: 'success' | 'failed';
    error?: string;
  }[];
}

// 验证管理员权限
async function verifyAdminAuth(request: NextRequest): Promise<boolean> {
  const sessionCookie = request.cookies.get('admin_session');
  const loggedInCookie = request.cookies.get('admin_logged_in');
  
  // 检查两个必要的 cookie 都存在
  return !!(sessionCookie?.value && loggedInCookie?.value === 'true');
}

export async function POST(request: NextRequest) {
  // 验证管理员权限
  const isAuthenticated = await verifyAdminAuth(request);
  if (!isAuthenticated) {
    return NextResponse.json(
      { error: '未授权访问' },
      { status: 401 }
    );
  }

  try {
    const data: ImportCodeItem[] = await request.json();

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { error: '数据必须是包含代码对象的数组' },
        { status: 400 }
      );
    }

    const result: ImportResult = {
      success: 0,
      failed: 0,
      errors: [],
      details: [],
    };

    // 批量处理
    for (const item of data) {
      const detail: ImportResult['details'][0] = {
        brand: item.brand || 'N/A',
        company: item.company || 'N/A',
        codeValue: item.codeValue || 'N/A',
        status: 'failed',
      };

      try {
        // 验证必填字段
        if (!item.brand || !item.company || !item.codeValue) {
          throw new Error('缺少必填字段: brand, company, codeValue');
        }

        // 清理数据
        const brandName = item.brand.trim();
        const companyName = item.company.trim();
        const codeValue = item.codeValue.trim();
        const description = item.description?.trim() || null;
        const codeType = item.codeType?.trim() || null;
        const source = item.source?.trim() || null;

        if (!brandName || !companyName || !codeValue) {
          throw new Error('字段值不能为空');
        }

        // 生成品牌的 slug
        const brandSlug = brandName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');

        // 先按 slug 查找品牌（避免大小写不同导致的重复）
        let brand = await prisma.brand.findUnique({
          where: { slug: brandSlug },
        });

        if (!brand) {
          brand = await prisma.brand.create({
            data: {
              name: brandName,
              slug: brandSlug,
            },
          });
        }

        // 生成公司的 slug
        const companySlug = companyName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');

        // 先按 slug 查找公司（避免大小写不同导致的重复）
        let company = await prisma.company.findUnique({
          where: { slug: companySlug },
        });

        if (!company) {
          company = await prisma.company.create({
            data: {
              name: companyName,
              slug: companySlug,
            },
          });
        }

        // 检查代码是否已存在（基于 brandId + companyId + codeValue）
        const existingCode = await prisma.code.findFirst({
          where: {
            brandId: brand.id,
            companyId: company.id,
            codeValue: codeValue,
          },
        });

        if (existingCode) {
          // 代码已存在，检查 description 是否相同
          const existingDesc = existingCode.description || '';
          const newDesc = description || '';

          if (existingDesc === newDesc) {
            // description 相同，跳过不入库
            throw new Error('代码已存在且描述相同，跳过');
          } else {
            // description 不同，替换更新
            await prisma.code.update({
              where: { id: existingCode.id },
              data: {
                description,
                codeType,
                source,
              },
            });
            detail.status = 'success';
            result.success++;
            result.details.push(detail);
            continue; // 跳过下面的创建逻辑
          }
        }

        // 创建新代码
        await prisma.code.create({
          data: {
            codeValue,
            description,
            codeType,
            source,
            brandId: brand.id,
            companyId: company.id,
          },
        });

        detail.status = 'success';
        result.success++;
      } catch (error) {
        detail.status = 'failed';
        detail.error = error instanceof Error ? error.message : '未知错误';
        result.failed++;
        result.errors.push(`${item.brand}-${item.company}: ${detail.error}`);
      }

      result.details.push(detail);
    }

    // 重新验证相关页面
    revalidatePath('/');
    revalidatePath('/admin');
    revalidatePath('/sitemap.xml');

    return NextResponse.json(result);
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '导入过程中发生错误' },
      { status: 500 }
    );
  }
}
