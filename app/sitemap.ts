import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://daktarbari.vercel.app";
  return [{ url: `${base}/`, changeFrequency: "daily", priority: 1 }, { url: `${base}/add`, priority: 0.5 }];
}
