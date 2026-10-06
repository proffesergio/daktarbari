import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { SEED_DOCTORS } from "@/lib/seed-doctors";
import { QIMP_DOCTORS } from "@/lib/seed-qimp14";
import { filterBdd } from "@/lib/seed-bddoctor";

export const dynamic = "force-dynamic";

// One-click: push all 95 local seeds (with photos) into Sheet + DB.
// Ids are stable (seed-01, qimp-01) so re-running never duplicates.
export async function POST() {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "অননুমোদিত" }, { status: 401 });
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return NextResponse.json({ error: "DB কনফিগার হয়নি" }, { status: 500 });
  try {
    const sb = getSupabaseAdmin();
    const rows = [...SEED_DOCTORS, ...QIMP_DOCTORS, ...filterBdd({})].map((d) => ({
      id: d.id,
      name_bn: d.name_bn,
      name_en: d.name_en,
      specialty_bn: d.specialty_bn,
      bmdc_reg_no: d.bmdc_reg_no,
      location_district: d.location_district,
      location_upazila_area: d.location_upazila_area,
      chamber_address_bn: d.chamber_address_bn,
      appointment_contact: d.appointment_contact,
      visiting_hours_bn: d.visiting_hours_bn,
      visiting_fee_approx: d.visiting_fee_approx,
      photo_url: d.photo_url ?? null,
      status: "PENDING",
      created_at: d.created_at,
    }));
    // chunked upsert to stay safe on large batches
    let synced = 0;
    for (let i = 0; i < rows.length; i += 25) {
      const { error } = await sb.from("doctors").upsert(rows.slice(i, i + 25), { onConflict: "id" });
      if (error) throw error;
      synced += Math.min(25, rows.length - i);
    }

    // mirror into Google Sheet Pending tab (skip existing ids)
    let sheetAdded = 0;
    try {
      if (process.env.GOOGLE_SHEET_ID && process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
        const { getSheetsClient, SHEET_TABS } = await import("@/lib/sheets");
        const sheets = getSheetsClient();
        const sid = process.env.GOOGLE_SHEET_ID;
        const [pe, ap] = await Promise.all([
          sheets.spreadsheets.values.get({ spreadsheetId: sid, range: `${SHEET_TABS.pending}!A:A` }),
          sheets.spreadsheets.values.get({ spreadsheetId: sid, range: `${SHEET_TABS.approved}!A:A` }),
        ]);
        const have = new Set([...(pe.data.values ?? []), ...(ap.data.values ?? [])].map((r) => r[0]));
        const fresh = rows.filter((r) => !have.has(r.id));
        if (fresh.length) {
          await sheets.spreadsheets.values.append({
            spreadsheetId: sid,
            range: `${SHEET_TABS.pending}!A:N`,
            valueInputOption: "RAW",
            requestBody: {
              values: fresh.map((r) => [r.id, r.name_bn, r.name_en ?? "", r.specialty_bn, r.bmdc_reg_no ?? "", r.location_district, r.location_upazila_area, r.chamber_address_bn, r.appointment_contact, r.visiting_hours_bn, r.visiting_fee_approx, "PENDING", r.created_at, r.photo_url ?? ""]),
            },
          });
          sheetAdded = fresh.length;
        }
      }
    } catch {
      // DB is done; sheet can be synced later via Sheet Sync button
    }
    return NextResponse.json({ ok: true, synced, total: rows.length, sheetAdded });
  } catch {
    return NextResponse.json({ error: "Seed ব্যর্থ" }, { status: 500 });
  }
}
