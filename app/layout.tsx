import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { prisma } from "@/lib/db";
import Script from "next/script";
import GlobalTaskNotifier from "@/components/GlobalTaskNotifier";

// 优化字体加载
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Car Rental Corporate Codes 2026 | Hertz, Enterprise, Avis Discounts",
  description: "Verified car rental corporate codes for Hertz, Enterprise, Avis, Budget. Save 10-25% on business travel with CDP and PC codes. Updated daily.",
  keywords: ["car rental corporate codes", "hertz cdp codes", "enterprise discount codes", "avis corporate codes", "rental car discounts"],
};

// 获取 AdSense 配置
async function getAdSenseConfig() {
  try {
    const config = await prisma.adSenseConfig.findFirst();
    return config;
  } catch {
    return null;
  }
}

// 获取 Analytics 配置
async function getAnalyticsConfig() {
  try {
    const config = await prisma.googleAnalyticsConfig.findFirst();
    return config;
  } catch {
    return null;
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 仅查询基础配置，不再有任何 Dynamic API 阻碍静态化
  const [adSenseConfig, analyticsConfig] = await Promise.all([
    getAdSenseConfig(),
    getAnalyticsConfig(),
  ]);

  const shouldLoadAdSense = adSenseConfig?.isEnabled && adSenseConfig?.publisherId;
  const shouldLoadAnalytics = analyticsConfig?.isEnabled && analyticsConfig?.measurementId;

  return (
    <html lang="en" className={inter.variable}>
      <head>
        {shouldLoadAdSense && (
          <Script
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adSenseConfig.publisherId}`}
            strategy="afterInteractive"
            crossOrigin="anonymous"
          />
        )}
        {shouldLoadAnalytics && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${analyticsConfig.measurementId}`}
              strategy="afterInteractive"
            />
            <Script
              id="ga4-config"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  // 客户端判断：如果是管理员，禁用 GA 追踪
                  if (${analyticsConfig.excludeAdmin} && document.cookie.indexOf('admin_session=true') > -1) {
                    window['ga-disable-${analyticsConfig.measurementId}'] = true;
                  }

                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${analyticsConfig.measurementId}'${analyticsConfig.anonymizeIp ? ", { 'anonymize_ip': true }" : ''});
                `,
              }}
            />
          </>
        )}
      </head>
      <body className="font-sans">
        {children}
        <GlobalTaskNotifier /> {/* 🚀 全局任务监控哨兵 */}
      </body>
    </html>
  );
}
