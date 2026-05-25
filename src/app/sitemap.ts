import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://dawrk.app";
  const locales = ["ar", "en"];

  const staticRoutes = locales.flatMap((locale) => [
    { url: `${baseUrl}/${locale}`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 1 },
    { url: `${baseUrl}/${locale}/dashboard`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.5 },
  ]);

  return staticRoutes;
}
