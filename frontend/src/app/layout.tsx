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
  title: "甲状腺疾病科普",
  description: "一个关于甲状腺疾病的科普网站，提供相关文章和信息。",
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
