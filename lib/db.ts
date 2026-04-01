import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';

// 全局缓存 Prisma 客户端（防止热重载时创建多个实例）
declare global {
  var prisma: PrismaClient | undefined;
}

// 检查是否使用 Turso（Vercel 环境）
const useTurso = process.env.VERCEL === '1';

function createPrismaClient(): PrismaClient {
  if (useTurso && process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
    // 使用 Turso 云端数据库 - PrismaLibSql 直接接收配置对象
    const adapter = new PrismaLibSql({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    return new PrismaClient({ adapter });
  }
  
  // 使用本地 SQLite 数据库（通过 DATABASE_URL）
  return new PrismaClient();
}

// 导出 Prisma 客户端
export const prisma = global.prisma || createPrismaClient();

// 开发环境缓存客户端
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export default prisma;
