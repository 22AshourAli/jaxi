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
    default: "جاكسي",
    template: "%s | جاكسي",
  },
  description: "حجز دورك في صالون الحلاقة - جاكسي",
  manifest: "/manifest.webmanifest",
  icons: [
    { rel: "icon", url: "/icons/icon-192x192.svg", type: "image/svg+xml" },
    { rel: "apple-touch-icon", url: "/icons/icon-192x192.png" },
  ],
  keywords: ["barber", "حلاق", "queue", "حجز", "haircut", "الحلاق", "waiting list"],
  openGraph: {
    title: "جاكسي",
    description: "حجز دورك في صالون الحلاقة - جاكسي",
    type: "website",
    locale: "ar_AR",
    images: [{ url: "/icons/icon-512x512.svg" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "جاكسي",
    description: "حجز دورك في صالون الحلاقة - جاكسي",
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
        <Script id="schema-jsonld" type="application/ld+json" strategy="lazyOnload">
          {`{"@context":"https://schema.org","@type":"BarberShop","name":"جاكسي","url":"https://dorak-pearl.vercel.app","telephone":"+201094022327","address":{"@type":"PostalAddress","addressLocality":"الناصرية","addressCountry":"EG"},"openingHours":"Sa-Th 10:00-22:00","priceRange":"₤"}`}
        </Script>
        <Script id="sw-register" strategy="afterInteractive">
          {`if("serviceWorker" in navigator){navigator.serviceWorker.register("/sw.js").then(function(reg){reg.onupdatefound=function(){var installing=reg.installing;installing.onstatechange=function(){if(installing.state==="installed"&&navigator.serviceWorker.controller){if(confirm("نسخة جديدة متاحة! تحديث الآن؟\\nNew version available! Update now?")){window.location.reload()}}}}})}`}
        </Script>
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>{children}</body>
    </html>
  );
}
