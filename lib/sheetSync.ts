import { getSheetsClient, SHEET_TABS } from "@/lib/sheets";
import { getSupabaseAdmin } from "@/lib/supabase";

// Sheet → DB sync. Reads Pending + Approved tabs, upserts every row by id
// (column A), so re-running never duplicates. Sheet is the source of truth;
// Postgres is the fast cache the website reads.
export function rowToDoctor(r: string[]) {
  const [id, name_bn, name_en, specialty_bn, bmdc_reg_no, location_district, location_upazila_area, chamber_address_bn, appointment_contact, visiting_hours_bn, visiting_fee_approx, status, created_at, photo_url] = r;
  if (!id || !name_bn) return null;
  const st = status === "APPROVED" ? "APPROVED" : status === "REJECTED" ? "REJECTED" : "PENDING";
  return {
    id,
    name_bn,
    name_en: name_en || null,
    specialty_bn: specialty_bn || "মেডিসিন",
    bmdc_reg_no: bmdc_reg_no || null,
    location_district: location_district || "ঢাকা",
    location_upazila_area: location_upazila_area || "",
    chamber_address_bn: chamber_address_bn || "",
    appointment_contact: appointment_contact || "",
    visiting_hours_bn: visiting_hours_bn || "",
    visiting_fee_approx: visiting_fee_approx || "",
    photo_url: photo_url || null,
    status: st,
    created_at: created_at || new Date().toISOString(),
  };
}

export async function syncSheetToDb(): Promise<{ synced: number; total: number }> {
  const sheets = getSheetsClient();
  const sid = process.env.GOOGLE_SHEET_ID!;
  const [ap, pe] = await Promise.all([
    sheets.spreadsheets.values.get({ spreadsheetId: sid, range: `${SHEET_TABS.approved}!A:N` }),
    sheets.spreadsheets.values.get({ spreadsheetId: sid, range: `${SHEET_TABS.pending}!A:N` }),
  ]);
  const rows = [...(ap.data.values ?? []), ...(pe.data.values ?? [])].filter((r) => r[0] && r[0] !== "id");
  const byId = new Map<string, NonNullable<ReturnType<typeof rowToDoctor>>>();
  for (const r of rows) {
    const d = rowToDoctor(r);
    if (d) byId.set(d.id, d); // last write wins, keyed by id → no duplicates
  }
  const sb = getSupabaseAdmin();
  let synced = 0;
  for (const d of byId.values()) {
    const { error } = await sb.from("doctors").upsert(d, { onConflict: "id" });
    if (!error) synced++;
  }
  return { synced, total: byId.size };
}
