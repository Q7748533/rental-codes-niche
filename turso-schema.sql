-- 创建表结构
CREATE TABLE IF NOT EXISTS "Brand" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "defaultUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "Brand_slug_key" ON "Brand"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "Brand_name_key" ON "Brand"("name");

CREATE TABLE IF NOT EXISTS "Company" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "industry" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "Company_slug_key" ON "Company"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "Company_name_key" ON "Company"("name");

CREATE TABLE IF NOT EXISTS "Code" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "codeValue" TEXT NOT NULL,
    "description" TEXT,
    "isValid" BOOLEAN NOT NULL DEFAULT 1,
    "codeType" TEXT NOT NULL DEFAULT 'Business',
    "source" TEXT,
    "brandId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "Code_brandId_companyId_codeValue_key" ON "Code"("brandId", "companyId", "codeValue");

CREATE TABLE IF NOT EXISTS "AiQuery" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "userPrompt" TEXT NOT NULL,
    "aiSummary" TEXT NOT NULL,
    "seoTitle" TEXT NOT NULL,
    "seoContent" TEXT NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "AiQuery_slug_key" ON "AiQuery"("slug");

CREATE TABLE IF NOT EXISTS "PublicDeal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "linkUrl" TEXT NOT NULL,
    "buttonText" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT 1,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 插入示例数据（Hertz）
INSERT INTO "Brand" ("id", "name", "slug", "defaultUrl", "createdAt", "updatedAt") VALUES
('clv1h1x9p0000abcdef1', 'Hertz', 'hertz', 'https://www.hertz.com', datetime('now'), datetime('now'));

INSERT INTO "Company" ("id", "name", "slug", "industry", "createdAt", "updatedAt") VALUES
('clv1h2x9p0000abcdef2', 'IBM', 'ibm', 'Technology', datetime('now'), datetime('now')),
('clv1h3x9p0000abcdef3', 'Microsoft', 'microsoft', 'Technology', datetime('now'), datetime('now'));

INSERT INTO "Code" ("id", "codeValue", "description", "isValid", "codeType", "source", "brandId", "companyId", "createdAt", "updatedAt") VALUES
('clv1h4x9p0000abcdef4', 'CDP#123456', 'IBM Corporate Discount', 1, 'CDP', 'Official', 'clv1h1x9p0000abcdef1', 'clv1h2x9p0000abcdef2', datetime('now'), datetime('now')),
('clv1h5x9p0000abcdef5', 'PC#987654', 'Microsoft Partner Code', 1, 'PC', 'Official', 'clv1h1x9p0000abcdef1', 'clv1h3x9p0000abcdef3', datetime('now'), datetime('now'));
