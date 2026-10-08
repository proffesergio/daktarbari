import type { Metadata } from "next";
import { Hind_Siliguri, Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import LoadingBar from "@/components/LoadingBar";
import { Suspense } from "react";

const hindSiliguri = Hind_Siliguri({
  variable: "--font-hind",
  subsets: ["bengali", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ডাক্তার বাড়ি | daktarbari - বাংলাদেশের ডাক্তার ডিরেক্টরি",
  description:
    "জেলা, এলাকা ও বিশেষজ্ঞ অনুযায়ী ডাক্তার খুঁজুন। ফোনে সিরিয়াল বুকিং, ভিজিট ফি ও রোগী দেখার সময় সহ।",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="bn" className={`${hindSiliguri.variable} ${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#FAF7F0] text-gray-900">
        <Suspense fallback={null}>
          <LoadingBar />
        </Suspense>
        <Header />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-white/10 bg-[#0A1930] px-4 py-6 pb-24 text-center text-sm text-white/70 md:pb-6">
          ডাক্তার বাড়ি — তথ্য যাচাই করে ব্যবহার করুন | জরুরিতে ৯৯৯
          <span className="mt-1 block text-[11px] text-white/40">মানচিত্র সীমানা: geoBoundaries CC-BY-4.0</span>
        </footer>
        <BottomNav />
      </body>
    </html>
  );
}
