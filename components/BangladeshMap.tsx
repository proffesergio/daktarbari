"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import type { Feature, Geometry } from "geojson";
import type { Layer, LeafletMouseEvent } from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  canonicalDistrictEn,
  districtBnFromShape,
  divisionBnFromShape,
} from "@/lib/districtAliases";

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
      onSelectDistrict?.(bn, divBn);
      const params = new URLSearchParams();
      if (divBn) params.set("division", divBn);
      params.set("district", bn);
      router.push(`/doctors?${params.toString()}`);
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
          ৬৪ জেলা • ট্যাপ করলেই সার্চ
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
            scrollWheelZoom={false}
            className="h-[340px] w-full sm:h-[440px]"
            attributionControl
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a> • Boundaries: <a href="https://www.geoboundaries.org">geoBoundaries CC-BY-4.0</a>'
            />
            <GeoJSON
              key={`${max}-${selectedDistrict ?? ""}-${Object.keys(byDistrict).length}`}
              data={geo as never}
              style={(f) => styleFor((f as unknown as BdFeature | undefined)?.properties?.shapeName ?? "")}
              onEachFeature={onEach as never}
            />
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
          <p className="mt-0.5 text-[10px] text-gray-500">কম → বেশি • সোনালি = সিলেক্টেড</p>
        </div>
      </div>
    </div>
  );
}
