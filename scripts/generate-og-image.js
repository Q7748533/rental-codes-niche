const fs = require('fs');
const path = require('path');

// 创建简单的 SVG 作为 OG 图片
const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1e40af;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- 背景 -->
  <rect width="1200" height="630" fill="url(#bgGradient)"/>
  
  <!-- 装饰元素 -->
  <circle cx="100" cy="100" r="200" fill="#60a5fa" opacity="0.2"/>
  <circle cx="1100" cy="530" r="250" fill="#93c5fd" opacity="0.2"/>
  
  <!-- 主标题 -->
  <text x="600" y="250" font-family="Arial, sans-serif" font-size="64" font-weight="bold" fill="white" text-anchor="middle">
    Car Corporate Codes
  </text>
  
  <!-- 副标题 -->
  <text x="600" y="340" font-family="Arial, sans-serif" font-size="36" fill="#dbeafe" text-anchor="middle">
    Car Rental Corporate Codes
  </text>
  
  <!-- 描述 -->
  <text x="600" y="420" font-family="Arial, sans-serif" font-size="28" fill="#bfdbfe" text-anchor="middle">
    Save 10-25% on Hertz, Enterprise, Avis &amp; More
  </text>
  
  <!-- 底部信息 -->
  <text x="600" y="550" font-family="Arial, sans-serif" font-size="24" fill="#93c5fd" text-anchor="middle">
    Verified CDP &amp; PC Codes • Updated Daily
  </text>
</svg>`;

// 保存 SVG 文件
const publicDir = path.join(process.cwd(), 'public');
const svgPath = path.join(publicDir, 'og-image.svg');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(svgPath, svgContent);
console.log('✅ OG Image SVG created at:', svgPath);
console.log('📌 Note: Please convert this SVG to JPG (1200x630) for production use');
console.log('   You can use: https://convertio.co/svg-jpg/ or any image converter');
