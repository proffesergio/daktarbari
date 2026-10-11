// Map tile config — Free OSM default (no API key required).
// Admin can override via DB site_settings (admin panel → সেটিংস)
// or via env NEXT_PUBLIC_MAP_TILE_URL. Future providers (CARTO etc.)
// can be plugged without code changes.
//
// Priority: DB setting > env > built-in OSM default.

export const OSM_TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
export const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors • Boundaries: <a href="https://www.geoboundaries.org">geoBoundaries CC-BY-4.0</a>';

// Legacy CARTO Raster (now requires API key — kept for reference only).
// If you must use CARTO, set NEXT_PUBLIC_MAP_TILE_URL to e.g.:
//   https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?api_key=YOUR_KEY
// or paste it in Admin → সেটিংস → Tile URL.
export const CARTO_LIGHT_FREE =
  "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

export type MapSettings = {
  tileUrl: string;
  attribution: string;
  provider: "osm" | "custom";
  apiKeyConfigured: boolean;
};

export function resolveMapSettings(opts?: {
  dbTileUrl?: string | null;
  dbAttribution?: string | null;
  envTileUrl?: string | null;
  envAttribution?: string | null;
  apiKey?: string | null;
}): MapSettings {
  const dbTile = opts?.dbTileUrl?.trim();
  const envTile = opts?.envTileUrl?.trim() ?? process.env.NEXT_PUBLIC_MAP_TILE_URL?.trim();
  const tileUrl = dbTile || envTile || OSM_TILE_URL;

  const dbAttr = opts?.dbAttribution?.trim();
  const envAttr =
    opts?.envAttribution?.trim() ?? process.env.NEXT_PUBLIC_MAP_ATTRIBUTION?.trim();
  const attribution = dbAttr || envAttr || OSM_ATTRIBUTION;

  const apiKey =
    opts?.apiKey?.trim() ?? process.env.NEXT_PUBLIC_CARTO_API_KEY?.trim() ?? "";
  return {
    tileUrl,
    attribution,
    provider: tileUrl === OSM_TILE_URL ? "osm" : "custom",
    apiKeyConfigured: apiKey.length > 0,
  };
}
