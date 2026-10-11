import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { doctorSubmitSchema } from "@/lib/validation";
import { findDivisionByDistrict } from "@/lib/divisions";
import { parseFeeMin } from "@/lib/fees";
import { getSheetsClient, SHEET_TABS } from "@/lib/sheets";
import { logAdmin, logSync } from "@/lib/audit";
import { parseCsv } from "@/lib/csv";

export const dynamic = "force-dynamic";

const TEMPLATE_HEADERS = [
  "name_bn", "name_en", "specialty_bn", "bmdc_reg_no", "location_district",
  "location_upazila_area", "chamber_address_bn", "appointment_contact",
  "visiting_hours_bn", "visiting_fee_approx",
] as const;

// Template download: headers + one example row.
export async function GET() {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "অননুমোদিত" }, { status: 401 });
  const example = ["ডাঃ উদাহরণ রহিম", "Dr. Example Rahim", "মেডিসিন", "", "ঢাকা", "মিরপুর", "মিরপুর ১০, হেলথ কেয়ার", "01712345678", "বিকাল ৪টা–রাত ৮টা", "৫০০"];
  const csv = [TEMPLATE_HEADERS.join(","), example.map((c) => `"${c}"`).join(",")].join("\n");
  return new NextResponse(csv, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=doctors-template.csv" },
  });
}

// Upload: validates every row, inserts only valid ones as instant-live
// (APPROVED + unverified), mirrors to Sheet Pending. DB-wins: ids are fresh
// UUIDs so nothing existing is ever overwritten.
export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "অননুমোদিত" }, { status: 401 });
  let text = "";
  try {
    const fd = await req.formData();
    const file = fd.get("file");
    if (file instanceof Blob) text = await file.text();
  } catch {
    return NextResponse.json({ error: "ফাইল পড়া যায়নি" }, { status: 400 });
  }
  const rows = parseCsv(text);
  if (!rows.length) return NextResponse.json({ error: "খালি ফাইল" }, { status: 400 });
  const header = rows[0]!.map((h) => h.trim());
  const idx = (name: string) => header.indexOf(name);
  for (const h of ["name_bn", "specialty_bn", "location_district", "appointment_contact"] as const) {
    if (idx(h) < 0) return NextResponse.json({ error: `কলাম নেই: ${h} (টেমপ্লেট ডাউনলোড করুন)` }, { status: 400 });
  }
  const dataRows = rows.slice(1).slice(0, 200);
  const valid: Record<string, unknown>[] = [];
  const errors: { row: number; error: string }[] = [];
  dataRows.forEach((r, i) => {
    const get = (n: string) => (idx(n) >= 0 ? (r[idx(n)] ?? "").trim() : "");
    const p = doctorSubmitSchema.safeParse({
      name_bn: get("name_bn"),
      name_en: get("name_en"),
      specialty_bn: get("specialty_bn") || "মেডিসিন",
      bmdc_reg_no: get("bmdc_reg_no"),
      location_district: get("location_district"),
      location_upazila_area: get("location_upazila_area"),
      chamber_address_bn: get("chamber_address_bn"),
      appointment_contact: get("appointment_contact"),
      visiting_hours_bn: get("visiting_hours_bn"),
      visiting_fee_approx: get("visiting_fee_approx"),
    });
    if (!p.success) {
      errors.push({ row: i + 2, error: p.error.issues[0]?.message ?? "ভুল" });
      return;
    }
    const v = p.data;
    valid.push({
      id: crypto.randomUUID(),
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
      status: "APPROVED",
      verified: false,
      created_at: new Date().toISOString(),
    });
  });

  let imported = 0;
  let sheet: string = "skipped";
  try {
    const sb = getSupabaseAdmin();
    // Chunked insert; strip new columns on pre-migration DBs.
    for (let i = 0; i < valid.length; i += 25) {
      const chunk = valid.slice(i, i + 25);
      const { error } = await sb.from("doctors").insert(chunk);
      if (error && /column|location_division|fee_min|verified/i.test(error.message)) {
        const legacy = chunk.map(({ location_division: _d, fee_min: _f, verified: _v, ...r }) => r);
        const retry = await sb.from("doctors").insert(legacy);
        if (retry.error) throw retry.error;
        imported += legacy.length;
      } else if (error) {
        throw error;
      } else imported += chunk.length;
    }
    try {
      if (imported && process.env.GOOGLE_SHEET_ID && process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
        const sheets = getSheetsClient();
        await sheets.spreadsheets.values.append({
          spreadsheetId: process.env.GOOGLE_SHEET_ID,
          range: `${SHEET_TABS.pending}!A:N`,
          valueInputOption: "RAW",
          requestBody: {
            values: valid.slice(0, imported).map((r) => {
              const d = r as Record<string, string>;
              return [d.id, d.name_bn, d.name_en ?? "", d.specialty_bn, d.bmdc_reg_no ?? "", d.location_district, d.location_upazila_area, d.chamber_address_bn, d.appointment_contact, d.visiting_hours_bn, d.visiting_fee_approx, "APPROVED", d.created_at, ""];
            }),
          },
        });
        sheet = "appended";
      }
    } catch {
      sheet = "failed";
    }
  } catch {
    return NextResponse.json({ error: "DB-তে লেখা ব্যর্থ", imported, errors }, { status: 500 });
  }
  await logSync("csv-import", dataRows.length, imported, errors.length ? `${errors.length} সারি ভুল` : "");
  await logAdmin("bulk_import", null, `${imported}/${dataRows.length} • sheet:${sheet}`);
  return NextResponse.json({ ok: true, imported, total: dataRows.length, errors: errors.slice(0, 20), sheet });
}
