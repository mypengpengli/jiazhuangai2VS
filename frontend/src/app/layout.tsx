import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Layout from "@/components/Layout"; // Import the Layout component
import { AuthProvider } from "@/context/AuthContext"; // Import the AuthProvider

// Google Analytics 测量 ID
const GA_MEASUREMENT_ID = "G-7NJ868H0TH";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "加装AI助手 - AI资讯与工具导航",
  description: "加装AI助手，为你加装最新AI能力。探索大语言模型、生图模型、视频模型等前沿AI技术资讯与工具推荐。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8993064905196407"
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
