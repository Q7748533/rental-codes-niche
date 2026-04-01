const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function exportData() {
  console.log('Exporting data...');
  
  // 获取所有数据
  const brands = await prisma.brand.findMany();
  const companies = await prisma.company.findMany();
  const codes = await prisma.code.findMany();
  const aiQueries = await prisma.aiQuery.findMany();
  const publicDeals = await prisma.publicDeal.findMany();
  
  const data = {
    brands,
    companies,
    codes,
    aiQueries,
    publicDeals
  };
  
  fs.writeFileSync('data-export.json', JSON.stringify(data, null, 2));
  console.log('Data exported to data-export.json');
  console.log(`Brands: ${brands.length}`);
  console.log(`Companies: ${companies.length}`);
  console.log(`Codes: ${codes.length}`);
  console.log(`AI Queries: ${aiQueries.length}`);
  console.log(`Public Deals: ${publicDeals.length}`);
}

exportData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
