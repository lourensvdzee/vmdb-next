import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CookieBanner from "@/components/CookieBanner";
import TrackingScripts from "@/components/TrackingScripts";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "VMDb - Vegan Meat Database",
    template: "%s | VMDb",
  },
  description: "Discover and review plant-based meat alternatives. The IMDb for vegan meat products.",
  keywords: ["vegan", "plant-based", "meat alternatives", "reviews", "database"],
  icons: {
    icon: "/fav-vmdb.png",
    shortcut: "/fav-vmdb.png",
    apple: "/fav-vmdb.png",
  },
  openGraph: {
    title: "VMDb - Vegan Meat Database",
    description: "Discover and review plant-based meat alternatives.",
    url: "https://vmdb.me",
    siteName: "VMDb",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "VMDb - Vegan Meat Database",
    description: "Discover and review plant-based meat alternatives.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased min-h-screen flex flex-col`}>
        <Header />
        <div className="flex-1">
          {children}
        </div>
        <Footer />
        <CookieBanner />
        <Toaster />
        <Suspense fallback={null}>
          <TrackingScripts />
        </Suspense>
      </body>
    </html>
  );
}
