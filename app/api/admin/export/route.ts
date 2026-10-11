import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const COLS: Record<string, string[]> = {
  doctors: ["id", "name_bn", "name_en", "specialty_bn", "bmdc_reg_no", "location_district", "location_upazila_area", "chamber_address_bn", "appointment_contact", "visiting_hours_bn", "visiting_fee_approx", "status", "created_at"],
  serials: ["id", "doctor_id", "kind", "patient_name", "patient_phone", "preferred_date", "note", "status", "created_at"],
  reviews: ["id", "doctor_id", "rating", "comment", "patient_name", "status", "created_at"],
};

const TABLE: Record<string, string> = { doctors: "doctors", serials: "serial_requests", reviews: "doctor_reviews" };

function esc(v: unknown): string {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// Admin CSV export for offline work: ?table=doctors|serials|reviews
export async function GET(req: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "অননুমোদিত" }, { status: 401 });
  const table = new URL(req.url).searchParams.get("table") ?? "doctors";
  if (!COLS[table] || !TABLE[table]) return NextResponse.json({ error: "টেবিল: doctors|serials|reviews" }, { status: 400 });
  try {
    const sb = getSupabaseAdmin();
    const { data } = await sb.from(TABLE[table]).select(COLS[table].join(",")).limit(5000);
    const lines = [
      COLS[table].join(","),
      ...((data ?? []) as unknown as Record<string, unknown>[]).map((r) => COLS[table].map((c) => esc(r[c])).join(",")),
    ];
    return new NextResponse(`\uFEFF${lines.join("\n")}`, {
      headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename=${table}.csv` },
    });
  } catch {
    return NextResponse.json({ error: "এক্সপোর্ট ব্যর্থ" }, { status: 500 });
  }
}
