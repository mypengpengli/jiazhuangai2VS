import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Layout from "@/components/Layout"; // Import the Layout component
import { AuthProvider } from "@/context/AuthContext"; // Import the AuthProvider

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "家装AI助手",
  description: "家装AI助手，提供智能家装设计、方案推荐和行业资讯。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider> {/* Wrap Layout (and thus children) with AuthProvider */}
          <Layout>{children}</Layout>
        </AuthProvider>
      </body>
    </html>
  );
}
