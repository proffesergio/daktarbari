import type { MetadataRoute } from "next";
import { getSupabasePublic } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

// Dynamic sitemap: core pages + every live doctor profile (instant-live
// submissions get indexed without manual steps).
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://daktarbari.vercel.app";
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/doctors`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/all-doctors`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/hospitals`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/diagnostics`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/add`, priority: 0.5 },
  ];
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return staticPages;
  try {
    const sb = getSupabasePublic();
    const { data } = await sb.from("doctors").select("id,created_at").eq("status", "APPROVED").order("created_at", { ascending: false }).limit(2000);
    const profiles: MetadataRoute.Sitemap = ((data ?? []) as { id: string; created_at: string }[]).map((d) => ({
      url: `${base}/doctor/${d.id}`,
      lastModified: d.created_at ? new Date(d.created_at) : undefined,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
    return [...staticPages, ...profiles];
  } catch {
    return staticPages;
  }
}
