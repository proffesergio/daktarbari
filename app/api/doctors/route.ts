import { NextResponse } from "next/server";
import { getSupabasePublic } from "@/lib/supabase";
import { applySearch } from "@/lib/search";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const filters = {
    division: searchParams.get("division") || undefined,
    district: searchParams.get("district") || undefined,
    area: searchParams.get("area") || undefined,
    specialty: searchParams.get("specialty") || undefined,
    q: searchParams.get("q") || undefined,
    fee: (["all", "lt500", "500_1000", "gt1000"].includes(searchParams.get("fee") ?? "")
      ? searchParams.get("fee")
      : "all") as never,
    sort: searchParams.get("sort") === "fee_asc" ? ("fee_asc" as const) : ("smart" as const),
  };

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json({ doctors: [], mock: true });
  }

  try {
    const sb = getSupabasePublic();
    // Fetch broad set, filter in JS for division/fee/q compat (no new columns required yet)
    let q = sb.from("doctors").select("*").eq("status", "APPROVED").order("created_at", { ascending: false }).limit(200);
    if (filters.district) q = q.eq("location_district", filters.district);
    if (filters.area) q = q.eq("location_upazila_area", filters.area);
    if (filters.specialty) q = q.eq("specialty_bn", filters.specialty);
    const { data, error } = await q;
    if (error) throw error;
    const doctors = applySearch((data ?? []) as never[], filters as never);
    return NextResponse.json({ doctors });
  } catch {
    return NextResponse.json({ doctors: [], error: "DB_ERROR" }, { status: 500 });
  }
}
