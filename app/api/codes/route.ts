import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  try {
    // 1. 解析你从自动化脚本推送过来的 JSON 数据
    const body = await request.json();
    const { brandName, companyName, codeValue, description } = body;

    // 2. 检查必须的数据有没有漏掉
    if (!brandName || !companyName || !codeValue) {
      return NextResponse.json(
        { error: '缺少必要字段：brandName, companyName 或 codeValue' },
        { status: 400 }
      );
    }

    // 确保是字符串类型
    const brandNameStr = String(brandName);
    const companyNameStr = String(companyName);
    const codeValueStr = String(codeValue);

    // 3. 自动生成用于网页链接的 slug (比如把 "IBM Corp" 变成 "ibm-corp")
    const brandSlug = brandNameStr.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const companySlug = companyNameStr.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    // 4. 在数据库里找这个租车品牌，如果没有就自动新建一个
    const brand = await prisma.brand.upsert({
      where: { 
        name: brandNameStr 
      },
      update: {},
      create: {
        name: brandNameStr,
        slug: brandSlug,
      },
    });

    // 5. 在数据库里找这个公司，如果没有就自动新建一个
    const company = await prisma.company.upsert({
      where: { 
        name: companyNameStr 
      },
      update: {},
      create: {
        name: companyNameStr,
        slug: companySlug,
      },
    });

    // 6. 录入核心的折扣代码！如果代码已经存在就更新描述，不存在就新建
    const code = await prisma.code.upsert({
      where: {
        brandId_companyId_codeValue: {
          brandId: brand.id,
          companyId: company.id,
          codeValue: codeValueStr,
        },
      },
      update: {
        description: description || null,
      },
      create: {
        codeValue: codeValueStr,
        description: description || null,
        brandId: brand.id,
        companyId: company.id,
      },
    });

    // 7. 成功录入后，给你的脚本返回一个成功的信号
    return NextResponse.json(
      { success: true, message: '代码录入成功！', data: code }, 
      { status: 200 }
    );

  } catch (error) {
    console.error('API 录入出错:', error);
    return NextResponse.json(
      { error: '服务器内部错误，请检查日志' },
      { status: 500 }
    );
  }
}