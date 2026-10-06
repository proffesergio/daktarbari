import { NextResponse } from "next/server";
import { doctorSubmitSchema } from "@/lib/validation";
import { getSupabaseAdmin, getSupabasePublic } from "@/lib/supabase";
import { getSheetsClient, SHEET_TABS } from "@/lib/sheets";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "ভুল ডেটা পাঠানো হয়েছে" }, { status: 400 });
  }

  const parsed = doctorSubmitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "ফর্ম ঠিক করুন" }, { status: 400 });
  }
  const v = parsed.data;
  const id = crypto.randomUUID();
  const created_at = new Date().toISOString();
  const row = { id, name_bn: v.name_bn, name_en: v.name_en || null, specialty_bn: v.specialty_bn, bmdc_reg_no: v.bmdc_reg_no || null, location_district: v.location_district, location_upazila_area: v.location_upazila_area, chamber_address_bn: v.chamber_address_bn, appointment_contact: v.appointment_contact, visiting_hours_bn: v.visiting_hours_bn, visiting_fee_approx: v.visiting_fee_approx, status: "PENDING" as const, created_at };

  // SHEET-FIRST: data lands in the Sheet first, then the DB cache.
  // 1) Google Sheet Pending append (best-effort, never blocks)
  try {
    if (process.env.GOOGLE_SHEET_ID && process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
      const sheets = getSheetsClient();
      await sheets.spreadsheets.values.append({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: `${SHEET_TABS.pending}!A:N`,
        valueInputOption: "RAW",
        requestBody: {
          values: [[row.id, row.name_bn, row.name_en ?? "", row.specialty_bn, row.bmdc_reg_no ?? "", row.location_district, row.location_upazila_area, row.chamber_address_bn, row.appointment_contact, row.visiting_hours_bn, row.visiting_fee_approx, "PENDING", row.created_at, ""]],
        },
      });
    }
  } catch {
    // ignore sheets failure — DB insert below still keeps the entry
  }

  // 2) Postgres PENDING insert (required for instant admin review)
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ error: "DB কনফিগার হয়নি" }, { status: 500 });
  }
  try {
    const sb = process.env.SUPABASE_SERVICE_ROLE_KEY ? getSupabaseAdmin() : getSupabasePublic();
    const { error } = await sb.from("doctors").insert(row);
    if (error) throw error;
  } catch {
    return NextResponse.json({ error: "ডাটাবেজে সংরক্ষণ ব্যর্থ" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id });
}
