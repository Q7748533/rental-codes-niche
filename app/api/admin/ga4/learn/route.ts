import { NextResponse } from 'next/server';
import { learnFromHighPerformers } from '@/lib/learning';

// 获取模式学习结果
export async function GET() {
  try {
    const result = await learnFromHighPerformers();
    
    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('❌ [GA4 Learn] 模式学习失败:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
