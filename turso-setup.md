# Turso 数据库设置步骤

## 问题
Turso 云端数据库是空的，没有表结构。

## 解决方案

### 方法 1: 使用 Turso CLI 导入本地数据库（推荐）

```bash
# 1. 安装 Turso CLI
npm install -g @tursodatabase/turso

# 2. 登录 Turso
turso auth login

# 3. 将本地数据库导出并导入到 Turso
# 先导出本地数据库为 SQL
sqlite3 prisma/dev.db .dump > dump.sql

# 4. 在 Turso 上执行 SQL
turso db shell carcodes-db < dump.sql
```

### 方法 2: 使用 Turso Dashboard

1. 访问 https://turso.tech/app
2. 进入你的数据库 `carcodes-db`
3. 点击 "SQL Console"
4. 复制 `prisma/dev.db` 的内容并执行

### 方法 3: 重新创建数据库

如果数据不重要，可以直接在 Turso 创建新数据库：

```bash
# 删除旧数据库
turso db destroy carcodes-db

# 创建新数据库
turso db create carcodes-db

# 获取新的连接信息
turso db show carcodes-db
turso db tokens create carcodes-db
```

然后更新 Vercel 环境变量。

## 验证

导入完成后，在 Turso SQL Console 中运行：

```sql
SELECT name FROM sqlite_master WHERE type='table';
```

应该显示：
- AiQuery
- Brand
- Code
- Company
- PublicDeal
- _prisma_migrations
