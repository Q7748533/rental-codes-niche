/** @type {import('next').NextConfig} */
const nextConfig = {
  // 🚀 性能优化配置
  experimental: {
    // 优化CSS - 内联关键CSS
    optimizeCss: true,
    // 现代浏览器目标，减少polyfill
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  
  // 🚀 编译目标 - 现代浏览器，减少polyfill
  compiler: {
    // 移除console和debugger
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // 🚀 图片优化
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },
  
  // 🚀 压缩
  compress: true,
  
  // 🚀 输出配置
  output: 'standalone',
  
  // 🚀  powered by header
  poweredByHeader: false,
  
  // 🚀 重写规则 - 支持 Ads.txt 大小写变体
  async rewrites() {
    return [
      {
        source: '/Ads.txt',
        destination: '/ads.txt',
      },
      {
        source: '/ADS.TXT',
        destination: '/ads.txt',
      },
    ];
  },
};

module.exports = nextConfig;
