import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Layout from "@/components/Layout"; // Import the Layout component
import { AuthProvider } from "@/context/AuthContext"; // Import the AuthProvider

// Google Analytics 测量 ID
const GA_MEASUREMENT_ID = "G-7NJ868H0TH";
const ADSENSE_CLIENT_ID = "ca-pub-8993064905196407";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://jiazhuangai.com'),
  title: { default: '加装AI助手 - AI资讯与工具导航', template: '%s | 加装AI助手' },
  description: "加装AI助手，为你加装最新AI能力。探索大语言模型、生图模型、视频模型等前沿 AI 技术资讯与工具推荐。",
  keywords: ['AI资讯', '人工智能', '大语言模型', '生图模型', 'AI工具', 'AI硬件'],
  alternates: { canonical: '/' },
  openGraph: { type: 'website', locale: 'zh_CN', url: '/', siteName: '加装AI助手', title: '加装AI助手 - AI资讯与工具导航', description: '探索最新 AI 技术资讯、模型动态与实用工具。' },
  twitter: { card: 'summary', title: '加装AI助手 - AI资讯与工具导航', description: '探索最新 AI 技术资讯、模型动态与实用工具。' },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  manifest: '/manifest.webmanifest',
  other: {
    "google-adsense-account": ADSENSE_CLIENT_ID,
  },
};

export const viewport: Viewport = { themeColor: '#f5f7fa', colorScheme: 'light' };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <head>
        <script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
          crossOrigin="anonymous"
        ></script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Google Analytics */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
          `}
        </Script>
        <AuthProvider> {/* Wrap Layout (and thus children) with AuthProvider */}
          <Layout>{children}</Layout>
        </AuthProvider>
      </body>
    </html>
  );
}
