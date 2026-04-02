import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { prisma } from "@/lib/db";

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const adSenseConfig = await getAdSenseConfig();
  const shouldLoadAdSense = adSenseConfig?.isEnabled && adSenseConfig?.publisherId;

  return (
    <html lang="en" className={inter.variable}>
      <head>
        {shouldLoadAdSense && (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adSenseConfig.publisherId}`}
            crossOrigin="anonymous"
          />
        )}
      </head>
      <body className="font-sans">{children}</body>
    </html>
  );
}
