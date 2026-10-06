import type { Metadata } from "next";
import { Hind_Siliguri, Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";

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
      <body className="min-h-full flex flex-col bg-white text-gray-900">
        <Header />
        <main className="flex-1">{children}</main>
        <footer className="border-t px-4 py-6 text-center text-lg text-gray-600">
          ডাক্তার বাড়ি — তথ্য যাচাই করে ব্যবহার করুন | জরুরিতে ৯৯৯
        </footer>
      </body>
    </html>
  );
}
