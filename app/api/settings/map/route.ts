import { NextResponse } from "next/server";
import { OSM_TILE_URL, OSM_ATTRIBUTION } from "@/lib/mapConfig";

export const dynamic = "force-dynamic";

// Public map config — Tile URL + attribution.
// Priority: DB site_settings > env > OSM free default (no key needed).
// Never leaks the raw API key value, only whether one is configured.
export async function GET() {
  let tileUrl = process.env.NEXT_PUBLIC_MAP_TILE_URL?.trim() || OSM_TILE_URL;
  let attribution =
    process.env.NEXT_PUBLIC_MAP_ATTRIBUTION?.trim() || OSM_ATTRIBUTION;
  let apiKeyConfigured = !!process.env.NEXT_PUBLIC_CARTO_API_KEY?.trim();

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const { getSupabaseAdmin } = await import("@/lib/supabase");
      const sb = getSupabaseAdmin();
      const { data } = await sb.from("site_settings").select("key,value").in("key", [
        "map_tile_url",
        "map_attribution",
        "map_api_key",
      ]);
      const map = new Map((data ?? []).map((r) => [r.key as string, r.value as string]));
      const dbTile = map.get("map_tile_url")?.trim();
      const dbAttr = map.get("map_attribution")?.trim();
      const dbKey = map.get("map_api_key")?.trim();
      if (dbTile) tileUrl = dbTile;
      if (dbAttr) attribution = dbAttr;
      if (dbKey) apiKeyConfigured = true;
    } catch {
      // DB missing (fresh install without migration) — fall back to env/OSM.
    }
  }

  return NextResponse.json(
    {
      tileUrl,
      attribution,
      provider: tileUrl === OSM_TILE_URL ? "osm" : "custom",
      apiKeyConfigured,
    },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } },
  );
}
