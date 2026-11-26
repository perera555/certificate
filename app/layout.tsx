import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import Header from "@/components/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Original Certificate Creator",
  description: "Design your own seals and stickers, create verifiable certificates and download them as full-colour PDF.",
  applicationName: "Original Certificate Creator",
  appleWebApp: { capable: true, title: "Certificates", statusBarStyle: "black-translucent" },
  icons: { icon: "/icon-192.png" },
};

export const viewport: Viewport = {
  themeColor: "#0b1220",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Suspense fallback={<div className="h-[61px] border-b border-white/10" />}>
          <Header />
        </Suspense>
        <main className="flex-1">
          <Suspense fallback={<p className="px-4 py-16 text-center text-slate-400">Loading…</p>}>{children}</Suspense>
        </main>
        <footer className="border-t border-white/10 py-6 text-center text-xs text-slate-400">
          Original Certificate Creator · every certificate carries a serial number and a verification QR code
        </footer>
      </body>
    </html>
  );
}
