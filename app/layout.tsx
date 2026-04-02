import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import Script from "next/script";

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

// 检查是否为管理员（从 Middleware 传递的请求头读取）
async function isAdmin() {
  try {
    const headersList = await headers();
    return headersList.get('x-is-admin') === 'true';
  } catch {
    return false;
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [adSenseConfig, analyticsConfig, adminStatus] = await Promise.all([
    getAdSenseConfig(),
    getAnalyticsConfig(),
    isAdmin(),
  ]);

  const shouldLoadAdSense = adSenseConfig?.isEnabled && adSenseConfig?.publisherId;
  
  // Analytics：启用且（不排除管理员 或 不是管理员）
  const shouldLoadAnalytics = analyticsConfig?.isEnabled && 
    analyticsConfig?.measurementId &&
    !(analyticsConfig?.excludeAdmin && adminStatus);

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
      <body className="font-sans">{children}</body>
    </html>
  );
}
