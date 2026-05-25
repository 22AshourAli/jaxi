import type { Metadata } from "next";
import { Noto_Sans_Arabic, Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const notoSans = Noto_Sans_Arabic({
  variable: "--font-noto-sans",
  subsets: ["arabic"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://dawrk.app"),
  title: {
    default: "دورك - Dawrk",
    template: "%s | دورك - Dawrk",
  },
  description: "نظام إدارة قوائم الانتظار الذكي للمحلات الخدمية | Smart Queue Management System",
  manifest: "/manifest.json",
  icons: [{ rel: "icon", url: "/icons/icon-192x192.svg", type: "image/svg+xml" }],
  keywords: ["queue", "طابور", "دورك", "dawrk", "barber", "حلاق", "waiting list"],
  authors: [{ name: "Dawrk" }],
  openGraph: {
    title: "دورك - Dawrk",
    description: "نظام إدارة قوائم الانتظار الذكي",
    type: "website",
    locale: "ar_AR",
    images: [{ url: "/icons/icon-512x512.svg" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "دورك - Dawrk",
    description: "نظام إدارة قوائم الانتظار الذكي",
    images: ["/icons/icon-512x512.svg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${notoSans.variable} ${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {`(function(){try{var t=localStorage.getItem("theme");var r=t||"system";if(r==="system"){r=window.matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light"}document.documentElement.setAttribute("data-theme",r)}catch(e){}})()`}
        </Script>
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
