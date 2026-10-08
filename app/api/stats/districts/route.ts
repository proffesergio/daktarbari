import { NextResponse } from "next/server";
import { getSupabasePublic } from "@/lib/supabase";
import { ALL_DISTRICTS_FLAT } from "@/lib/divisions";

export const dynamic = "force-dynamic";
export const revalidate = 60;

type DistrictStat = { district: string; count: number };

export async function GET() {
  // No Supabase configured (local preview) — return empty live payload so the
  // map renders its empty-state instead of crashing.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json(
      { total: 0, byDistrict: {}, districts: [], live: false },
      { headers: { "Cache-Control": "public, s-maxage=60" } },
    );
  }

  try {
    const sb = getSupabasePublic();
    // Supabase JS has no GROUP BY — pull the district column for APPROVED rows
    // (indexed) and aggregate in JS. Cap at 5000 to bound payload size.
    const { data, error } = await sb
      .from("doctors")
      .select("location_district")
      .eq("status", "APPROVED")
      .limit(5000);
    if (error) throw error;

    const counts = new Map<string, number>();
    for (const row of (data ?? []) as { location_district: string }[]) {
      const k = (row.location_district ?? "").trim();
      if (!k) continue;
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }

    const districts: DistrictStat[] = ALL_DISTRICTS_FLAT.map((district) => ({
      district,
      count: counts.get(district) ?? 0,
    })).sort((a, b) => b.count - a.count);

    const byDistrict: Record<string, number> = {};
    for (const d of districts) byDistrict[d.district] = d.count;
    const total = districts.reduce((s, d) => s + d.count, 0);

    return NextResponse.json(
      { total, byDistrict, districts, live: true, updatedAt: new Date().toISOString() },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } },
    );
  } catch {
    return NextResponse.json(
      { total: 0, byDistrict: {}, districts: [], live: false, error: "DB_ERROR" },
      { status: 500 },
    );
  }
}
