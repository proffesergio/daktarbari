import { NextResponse } from "next/server";
import { getSheetsClient, SHEET_TABS } from "@/lib/sheets";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

function rowToDoctor(r: string[]) {
  const [id, name_bn, name_en, specialty_bn, bmdc_reg_no, location_district, location_upazila_area, chamber_address_bn, appointment_contact, visiting_hours_bn, visiting_fee_approx, status, created_at] = r;
  if (!id || !name_bn) return null;
  return { id, name_bn, name_en: name_en || null, specialty_bn, bmdc_reg_no: bmdc_reg_no || null, location_district, location_upazila_area, chamber_address_bn, appointment_contact, visiting_hours_bn, visiting_fee_approx, status: status === "APPROVED" ? "APPROVED" : "PENDING", created_at: created_at || new Date().toISOString() };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret") ?? req.headers.get("authorization")?.replace("Bearer ", "");
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "অননুমোদিত" }, { status: 401 });
  }
  if (!process.env.GOOGLE_SHEET_ID || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ ok: true, synced: 0, mock: true });
  }
  try {
    const sheets = getSheetsClient();
    const sid = process.env.GOOGLE_SHEET_ID;
    const [ap, pe] = await Promise.all([
      sheets.spreadsheets.values.get({ spreadsheetId: sid, range: `${SHEET_TABS.approved}!A:M` }),
      sheets.spreadsheets.values.get({ spreadsheetId: sid, range: `${SHEET_TABS.pending}!A:M` }),
    ]);
    const rows = [...(ap.data.values ?? []), ...(pe.data.values ?? [])].filter((r) => r[0] !== "id" && r[11] === "APPROVED");
    const docs = rows.map(rowToDoctor).filter(Boolean);
    // de-dupe by id, last wins
    const byId = new Map(docs.map((d) => [d!.id, d]));
    const sb = getSupabaseAdmin();
    let synced = 0;
    for (const d of byId.values()) {
      const { error } = await sb.from("doctors").upsert(d!, { onConflict: "id" });
      if (!error) synced++;
    }
    return NextResponse.json({ ok: true, synced, total: byId.size });
  } catch {
    return NextResponse.json({ error: "Sync ব্যর্থ" }, { status: 500 });
  }
}
