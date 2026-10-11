import { NextResponse } from "next/server";
import { doctorSubmitSchema } from "@/lib/validation";
import { getSupabaseAdmin, getSupabasePublic } from "@/lib/supabase";
import { getSheetsClient, SHEET_TABS } from "@/lib/sheets";
import { findDivisionByDistrict } from "@/lib/divisions";
import { parseFeeMin } from "@/lib/fees";
import { rateLimit, LIMITS } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const lim = await rateLimit(req, "submit", LIMITS.submit.limit, LIMITS.submit.windowMs);
  if (!lim.ok)
    return NextResponse.json({ error: "অনেক জমা দিয়েছেন — এক ঘণ্টা পরে আবার চেষ্টা করুন" }, { status: 429 });
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
  // INSTANT-LIVE policy: real submissions go public immediately with an
  // amber "unverified" badge; admin verification upgrades to verified.
  const fullRow = {
    id,
    name_bn: v.name_bn,
    name_en: v.name_en || null,
    specialty_bn: v.specialty_bn,
    bmdc_reg_no: v.bmdc_reg_no || null,
    location_division: v.location_division || findDivisionByDistrict(v.location_district),
    location_district: v.location_district,
    location_upazila_area: v.location_upazila_area,
    chamber_address_bn: v.chamber_address_bn,
    appointment_contact: v.appointment_contact,
    visiting_hours_bn: v.visiting_hours_bn,
    visiting_fee_approx: v.visiting_fee_approx,
    fee_min: parseFeeMin(v.visiting_fee_approx),
    status: "APPROVED" as const,
    verified: false,
    created_at,
  };
  // Legacy row without new columns (pre-migration DBs)
  const { location_division: _div, fee_min: _fee, verified: _ver, ...row } = fullRow;
  void _div;
  void _fee;
  void _ver;

  // SHEET MIRROR (DB-wins): data lands in Postgres first, then the Sheet.
  // 1) Google Sheet Pending append (best-effort, never blocks)
  let sheet: string = "skipped";
  try {
    if (process.env.GOOGLE_SHEET_ID && process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
      const sheets = getSheetsClient();
      await sheets.spreadsheets.values.append({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: `${SHEET_TABS.pending}!A:N`,
        valueInputOption: "RAW",
        requestBody: {
          values: [[row.id, row.name_bn, row.name_en ?? "", row.specialty_bn, row.bmdc_reg_no ?? "", row.location_district, row.location_upazila_area, row.chamber_address_bn, row.appointment_contact, row.visiting_hours_bn, row.visiting_fee_approx, "APPROVED", row.created_at, ""]],
        },
      });
      sheet = "appended";
    }
  } catch {
    // ignore sheets failure — DB insert below still keeps the entry
  }

  // 2) Postgres insert — instantly live with unverified badge
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ error: "DB কনফিগার হয়নি" }, { status: 500 });
  }
  try {
    const sb = process.env.SUPABASE_SERVICE_ROLE_KEY ? getSupabaseAdmin() : getSupabasePublic();
    // Fraud signal: same phone already live → still publish, but flag for admin.
    let duplicate = false;
    try {
      const { count } = await sb.from("doctors").select("id", { count: "exact", head: true }).eq("appointment_contact", fullRow.appointment_contact);
      duplicate = (count ?? 0) > 0;
    } catch {
      duplicate = false;
    }
    let { error } = await sb.from("doctors").insert(fullRow);
    if (error && /column|location_division|fee_min|verified/i.test(error.message)) {
      const retry = await sb.from("doctors").insert(row);
      error = retry.error;
    }
    if (error) throw error;
    return NextResponse.json({ ok: true, id, live: true, verified: false, sheet, duplicate });
  } catch {
    return NextResponse.json({ error: "ডাটাবেজে সংরক্ষণ ব্যর্থ" }, { status: 500 });
  }
}

