import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

console.log('正在清空数据...');

// 按照外键依赖顺序删除
await prisma.code.deleteMany();
console.log('✓ 已删除所有代码');

await prisma.aiQuery.deleteMany();
console.log('✓ 已删除所有AI文章');

await prisma.publicDeal.deleteMany();
console.log('✓ 已删除所有公开优惠');

await prisma.company.deleteMany();
console.log('✓ 已删除所有公司');

await prisma.brand.deleteMany();
console.log('✓ 已删除所有品牌');

console.log('\n✅ 所有数据已清空！');

await prisma.$disconnect();
