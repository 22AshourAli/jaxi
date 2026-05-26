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
  metadataBase: new URL("https://dorak-pearl.vercel.app"),
  title: {
    default: "الحلاق - Barber",
    template: "%s | الحلاق - Barber",
  },
  description: "حجز دورك في صالون الحلاقة - Queue booking for your barbershop",
  manifest: "/manifest.webmanifest",
  icons: [{ rel: "icon", url: "/icons/icon-192x192.svg", type: "image/svg+xml" }],
  keywords: ["barber", "حلاق", "queue", "حجز", "haircut", "الحلاق", "waiting list"],
  openGraph: {
    title: "الحلاق - Barber",
    description: "حجز دورك في صالون الحلاقة",
    type: "website",
    locale: "ar_AR",
    images: [{ url: "/icons/icon-512x512.svg" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "الحلاق - Barber",
    description: "حجز دورك في صالون الحلاقة",
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
      className={`${notoSans.variable} ${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {`(function(){try{var t=localStorage.getItem("theme");var r=t||"system";if(r==="system"){r=window.matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light"}document.documentElement.setAttribute("data-theme",r)}catch(e){}try{var p=location.pathname;var m=p.match(/^\\/(ar|en)(\\/|$)/);if(m){document.documentElement.setAttribute("lang",m[1]);document.documentElement.setAttribute("dir",m[1]==="ar"?"rtl":"ltr")}}catch(e){}})()`}
        </Script>
        <Script id="sw-register" strategy="afterInteractive">
          {`if("serviceWorker" in navigator){navigator.serviceWorker.register("/sw.js")}`}
        </Script>
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>{children}</body>
    </html>
  );
}
