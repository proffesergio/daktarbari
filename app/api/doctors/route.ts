import { NextResponse } from "next/server";
import { getSupabasePublic } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const district = searchParams.get("district") ?? "";
  const area = searchParams.get("area") ?? "";
  const specialty = searchParams.get("specialty") ?? "";

  // Build-safe fallback: no env in local build -> return empty list
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json({ doctors: [], mock: true });
  }

  try {
    const sb = getSupabasePublic();
    let q = sb.from("doctors").select("*").eq("status", "APPROVED").order("created_at", { ascending: false }).limit(50);
    if (district) q = q.eq("location_district", district);
    if (area) q = q.eq("location_upazila_area", area);
    if (specialty) q = q.eq("specialty_bn", specialty);
    const { data, error } = await q;
    if (error) throw error;
    return NextResponse.json({ doctors: data ?? [] });
  } catch {
    return NextResponse.json({ doctors: [], error: "DB_ERROR" }, { status: 500 });
  }
}
