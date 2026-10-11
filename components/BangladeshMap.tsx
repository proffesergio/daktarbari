"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MapContainer, TileLayer, GeoJSON, Marker, Tooltip } from "react-leaflet";
import L from "leaflet";
import type { Feature, Geometry, Position } from "geojson";
import type { Layer, LeafletMouseEvent } from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  canonicalDistrictEn,
  districtBnFromShape,
  divisionBnFromShape,
} from "@/lib/districtAliases";
import { OSM_TILE_URL, OSM_ATTRIBUTION } from "@/lib/mapConfig";

type Props = {
  byDistrict: Record<string, number>;
  total: number;
  live: boolean;
  loading: boolean;
  selectedDistrict?: string;
  onSelectDistrict?: (districtBn: string, divisionBn: string) => void;
};

type BdFeatureProps = { shapeName: string };
type BdFeature = Feature<Geometry, BdFeatureProps>;

// Bangladesh-only view: bbox with a little padding; the map cannot be
// panned or zoomed out past the country (base tiles still render at edges,
// but the 64-district overlay + bounds keep the focus on Bangladesh).
const BD_BOUNDS: [[number, number], [number, number]] = [
  [20.0, 87.6],
  [27.0, 93.1],
];

// Centroid approx via bbox center — cheap and stable for small districts.
function centroidOf(geometry: Geometry): [number, number] | null {
  let minLat = 90;
  let maxLat = -90;
  let minLng = 180;
  let maxLng = -180;
  const visit = (coords: unknown): void => {
    if (Array.isArray(coords) && typeof coords[0] === "number") {
      const [lng, lat] = coords as Position;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
    } else if (Array.isArray(coords)) {
      for (const c of coords) visit(c);
    }
  };
  visit((geometry as { coordinates: unknown }).coordinates);
  if (minLat > maxLat || minLng > maxLng) return null;
  return [(minLat + maxLat) / 2, (minLng + maxLng) / 2];
}

function countIcon(count: number, selected: boolean): L.DivIcon {
  return L.divIcon({
    className: "bd-count-marker",
    html:
      `<div style="display:flex;align-items:center;justify-content:center;` +
      `min-width:26px;height:26px;padding:0 6px;border-radius:9999px;` +
      `font-size:12px;font-weight:800;color:${selected ? "#0A1930" : "#FFFFFF"};` +
      `background:${selected ? "#C9A86A" : "#14365D"};` +
      `border:2px solid #FFFFFF;box-shadow:0 1px 4px rgba(10,25,48,.45);">` +
      `${count}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
}

// Sophisticated navy/harbor choropleth — densest districts go full ink navy,
// empty districts stay warm parchment so the live fill reads instantly.
function fillFor(count: number, max: number): string {
  if (count <= 0 || max <= 0) return "#ECE3CC";
  const r = count / max;
  if (r >= 0.6) return "#14365D";
  if (r >= 0.3) return "#2F7E79";
  if (r >= 0.12) return "#7FB5B0";
  return "#C4DAD6";
}

export default function BangladeshMap({
  byDistrict,
  total,
  live,
  loading,
  selectedDistrict,
  onSelectDistrict,
}: Props) {
  const router = useRouter();
  const [geo, setGeo] = useState<{ type: string; features: BdFeature[] } | null>(null);
  const [geoError, setGeoError] = useState(false);
  // Map tiles: free OSM default (no key). Admin can override via
  // Admin → সেটিংস → Tile URL (DB site_settings) or NEXT_PUBLIC_MAP_TILE_URL.
  const [tileUrl, setTileUrl] = useState(OSM_TILE_URL);
  const [attribution, setAttribution] = useState(OSM_ATTRIBUTION);
  const [provider, setProvider] = useState<"osm" | "custom">("osm");

  useEffect(() => {
    let alive = true;
    fetch("/api/settings/map", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (alive && j?.tileUrl) {
          setTileUrl(j.tileUrl);
          setAttribution(j.attribution || OSM_ATTRIBUTION);
          setProvider(j.provider === "custom" ? "custom" : "osm");
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    fetch("/data/bd-districts.geojson")
      .then((r) => {
        if (!r.ok) throw new Error("geojson");
        return r.json();
      })
      .then((j) => {
        if (alive) setGeo(j);
      })
      .catch(() => {
        if (alive) setGeoError(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  const max = useMemo(
    () => Math.max(1, ...Object.values(byDistrict), 1),
    [byDistrict],
  );

  function goToDistrict(bn: string, divBn: string) {
    onSelectDistrict?.(bn, divBn);
    const params = new URLSearchParams();
    if (divBn) params.set("division", divBn);
    params.set("district", bn);
    router.push(`/doctors?${params.toString()}`);
  }

  // Numbered pills for every district that has doctors (live counters).
  const markers = useMemo(() => {
    if (!geo) return [];
    const out: { pos: [number, number]; bn: string; divBn: string; count: number }[] = [];
    for (const f of geo.features) {
      const bn = districtBnFromShape(f.properties.shapeName);
      const count = byDistrict[bn] ?? 0;
      if (count <= 0) continue;
      const pos = centroidOf(f.geometry);
      if (!pos) continue;
      out.push({ pos, bn, divBn: divisionBnFromShape(f.properties.shapeName), count });
    }
    return out;
  }, [geo, byDistrict]);

  const styleFor = (shapeName: string) => {
    const bn = districtBnFromShape(shapeName);
    const count = byDistrict[bn] ?? 0;
    const isSelected = selectedDistrict === bn;
    return {
      fillColor: isSelected ? "#C9A86A" : fillFor(count, max),
      weight: isSelected ? 2.5 : 1,
      color: isSelected ? "#0A1930" : "#FFFFFF",
      opacity: 1,
      fillOpacity: count > 0 ? 0.82 : 0.55,
      className: count > 0 ? "bd-district-live" : undefined,
    };
  };

  const onEach = (feature: BdFeature, layer: Layer) => {
    const shapeName = feature.properties.shapeName;
    const bn = districtBnFromShape(shapeName);
    const divBn = divisionBnFromShape(shapeName);
    const count = byDistrict[bn] ?? 0;
    layer.bindTooltip(
      `<div style="text-align:center"><div style="font-size:14px">${bn}</div>` +
        `<div style="font-size:11px;font-weight:500;opacity:.75">${divBn} • ${canonicalDistrictEn(shapeName)}</div>` +
        `<div style="margin-top:2px;font-size:13px;color:#14365D">${count} জন ডাক্তার</div>` +
        `<div style="font-size:11px;font-weight:600;color:#256662">ট্যাপ করলে সার্চ হবে →</div></div>`,
      { sticky: true, direction: "top", className: "bd-map-tooltip" },
    );
    layer.on("click", (e: LeafletMouseEvent) => {
      e.originalEvent?.stopPropagation?.();
      goToDistrict(bn, divBn);
    });
    layer.on("mouseover", (e: LeafletMouseEvent) => {
      const target = e.target as unknown as {
        setStyle: (s: Record<string, unknown>) => void;
      };
      target.setStyle({ weight: 2.5, color: "#0A1930", fillOpacity: 0.95 });
    });
    layer.on("mouseout", (e: LeafletMouseEvent) => {
      const target = e.target as unknown as {
        setStyle: (s: Record<string, unknown>) => void;
      };
      const bnName = districtBnFromShape(shapeName);
      const c = byDistrict[bnName] ?? 0;
      const isSel = selectedDistrict === bnName;
      target.setStyle({
        weight: isSel ? 2.5 : 1,
        color: isSel ? "#0A1930" : "#FFFFFF",
        fillColor: isSel ? "#C9A86A" : fillFor(c, max),
        fillOpacity: c > 0 ? 0.82 : 0.55,
      });
    });
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-[#E9DFC9] bg-[#FAF7F0] shadow-sm">
      {/* Live header */}
      <div className="flex flex-wrap items-center gap-2 bg-[#0A1930] px-4 py-3 text-white">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-live-dot absolute inline-flex h-full w-full rounded-full bg-emerald-400" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
        </span>
        <p className="text-sm font-bold">
          {loading ? "লাইভ মানচিত্র লোড হচ্ছে…" : live ? `লাইভ • মোট ${total} জন ডাক্তার` : "মানচিত্র প্রস্তুত — তথ্য যোগ হলে লাইভ হবে"}
        </p>
        <span className="ml-auto hidden rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-[#E2C78F] sm:inline">
          ৬৪ জেলা • ট্যাপ করলেই সার্চ • {provider === "osm" ? "OSM ফ্রি" : "কাস্টম টাইল"}
        </span>
      </div>

      <div className="relative">
        {loading && !geo ? (
          <div className="flex h-[340px] items-center justify-center bg-[#F3ECDD] text-sm font-semibold text-[#23456F] sm:h-[440px]">
            <span className="animate-pulse">🗺️ মানচিত্র আঁকা হচ্ছে…</span>
          </div>
        ) : geoError || !geo ? (
          <div className="flex h-[340px] flex-col items-center justify-center gap-2 bg-[#F3ECDD] px-6 text-center sm:h-[440px]">
            <p className="text-sm font-bold text-[#0A1930]">মানচিত্র ফাইল লোড হয়নি</p>
            <p className="text-xs text-gray-600">public/data/bd-districts.geojson আছে কিনা দেখুন, পেজ রিফ্রেশ করুন।</p>
          </div>
        ) : (
          <MapContainer
            center={[23.685, 90.356]}
            zoom={7}
            minZoom={6}
            maxZoom={12}
            maxBounds={BD_BOUNDS}
            maxBoundsViscosity={1.0}
            scrollWheelZoom={false}
            className="h-[340px] w-full sm:h-[440px]"
            attributionControl
          >
            <TileLayer url={tileUrl} attribution={attribution} />
            <GeoJSON
              key={`${max}-${selectedDistrict ?? ""}-${Object.keys(byDistrict).length}`}
              data={geo as never}
              style={(f) => styleFor((f as unknown as BdFeature | undefined)?.properties?.shapeName ?? "")}
              onEachFeature={onEach as never}
            />
            {markers.map((m) => (
              <Marker
                key={m.bn}
                position={m.pos}
                icon={countIcon(m.count, selectedDistrict === m.bn)}
                keyboard={false}
                eventHandlers={{ click: () => goToDistrict(m.bn, m.divBn) }}
              >
                <Tooltip direction="top" offset={[0, -14]} opacity={0.95}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "14px", fontWeight: 700 }}>{m.bn}</div>
                    <div style={{ fontSize: "12px", color: "#14365D" }}>{m.count} জন ডাক্তার</div>
                  </div>
                </Tooltip>
              </Marker>
            ))}
          </MapContainer>
        )}

        {/* Legend */}
        <div className="absolute bottom-3 left-3 rounded-xl border border-[#E9DFC9] bg-white/95 px-3 py-2 shadow-md backdrop-blur">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#23456F]">ডাক্তার ঘনত্ব</p>
          <div className="mt-1 flex items-center gap-1.5">
            {["#ECE3CC", "#C4DAD6", "#7FB5B0", "#2F7E79", "#14365D"].map((c) => (
              <span key={c} className="h-3 w-5 rounded-sm border border-white shadow-sm" style={{ background: c }} />
            ))}
          </div>
          <p className="mt-0.5 text-[10px] text-gray-500">কম → বেশি • সংখ্যা = ডাক্তার • সোনালি = সিলেক্টেড</p>
        </div>
      </div>
    </div>
  );
}
