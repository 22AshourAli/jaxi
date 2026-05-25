import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "دورك - Dawrk",
    short_name: "دورك",
    description: "نظام إدارة قوائم الانتظار الذكي",
    start_url: "/ar",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#2563eb",
    orientation: "portrait",
    lang: "ar",
    dir: "rtl",
    icons: [
      { src: "/icons/icon-192x192.svg", sizes: "192x192", type: "image/svg+xml" },
      { src: "/icons/icon-512x512.svg", sizes: "512x512", type: "image/svg+xml" },
      { src: "/icons/icon-192x192.svg", sizes: "192x192", type: "image/svg+xml", purpose: "maskable" },
      { src: "/icons/icon-512x512.svg", sizes: "512x512", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
