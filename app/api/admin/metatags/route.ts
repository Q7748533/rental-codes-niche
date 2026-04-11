import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// 获取所有 meta 标签
export async function GET() {
  try {
    const metaTags = await prisma.metaTag.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(metaTags);
  } catch (error) {
    console.error('Get meta tags error:', error);
    return NextResponse.json({ error: 'Failed to fetch meta tags' }, { status: 500 });
  }
}

// 创建或更新 meta 标签
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, name, content, isEnabled, description } = body;

    if (!name || !content) {
      return NextResponse.json({ error: 'Name and content are required' }, { status: 400 });
    }

    let metaTag;
    if (id) {
      // 更新现有标签
      metaTag = await prisma.metaTag.update({
        where: { id },
        data: { name, content, isEnabled, description }
      });
    } else {
      // 创建新标签
      metaTag = await prisma.metaTag.create({
        data: { name, content, isEnabled, description }
      });
    }

    return NextResponse.json(metaTag);
  } catch (error: any) {
    console.error('Save meta tag error:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'A meta tag with this name already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to save meta tag' }, { status: 500 });
  }
}

// 删除 meta 标签
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await prisma.metaTag.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete meta tag error:', error);
    return NextResponse.json({ error: 'Failed to delete meta tag' }, { status: 500 });
  }
}
