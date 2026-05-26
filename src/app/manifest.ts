import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "الحلاق - Barber",
    short_name: "الحلاق",
    description: "حجز دورك في صالون الحلاقة",
    start_url: "/ar",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#2563eb",
    orientation: "portrait",
    lang: "ar",
    dir: "rtl",
    icons: [
      { src: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-192x192.svg", sizes: "192x192", type: "image/svg+xml" },
      { src: "/icons/icon-512x512.svg", sizes: "512x512", type: "image/svg+xml" },
      { src: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
