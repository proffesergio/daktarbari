import { getSheetsClient, SHEET_TABS } from "@/lib/sheets";
import { getSupabaseAdmin } from "@/lib/supabase";
import { findDivisionByDistrict } from "@/lib/divisions";
import { parseFeeMin } from "@/lib/fees";

// Sheet → DB sync. Reads Pending + Approved tabs, upserts every row by id
// (column A), so re-running never duplicates. Sheet is the source of truth;
// Postgres is the fast cache the website reads.
// NOTE: appointment_contact (col I) IS the Phone/Appointment No./Contact
// column — validated as 01XXXXXXXXX on submit + backfilled on read.
// location_division + fee_min are DERIVED (not sheet columns) for search/sort.
export function rowToDoctor(r: string[]) {
  const [id, name_bn, name_en, specialty_bn, bmdc_reg_no, location_district, location_upazila_area, chamber_address_bn, appointment_contact, visiting_hours_bn, visiting_fee_approx, status, created_at, photo_url] = r;
  if (!id || !name_bn) return null;
  const st = status === "APPROVED" ? "APPROVED" : status === "REJECTED" ? "REJECTED" : "PENDING";
  const district = location_district || "ঢাকা";
  return {
    id,
    name_bn,
    name_en: name_en || null,
    specialty_bn: specialty_bn || "মেডিসিন",
    bmdc_reg_no: bmdc_reg_no || null,
    location_division: findDivisionByDistrict(district),
    location_district: district,
    location_upazila_area: location_upazila_area || "",
    chamber_address_bn: chamber_address_bn || "",
    appointment_contact: (appointment_contact || "").replace(/[\s\-()]/g, ""),
    visiting_hours_bn: visiting_hours_bn || "",
    visiting_fee_approx: visiting_fee_approx || "",
    fee_min: parseFeeMin(visiting_fee_approx || ""),
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
    // photo_url is not a DB column (seed-only); strip before upsert.
    // location_division/fee_min need migration — fallback without them.
    const { photo_url: _photo, ...dbRow } = d;
    void _photo;
    let { error } = await sb.from("doctors").upsert(dbRow, { onConflict: "id" });
    if (error && /column|location_division|fee_min/i.test(error.message)) {
      const { location_division: _div, fee_min: _fee, ...legacy } = dbRow;
      void _div;
      void _fee;
      const retry = await sb.from("doctors").upsert(legacy, { onConflict: "id" });
      error = retry.error;
    }
    if (!error) synced++;
  }
  return { synced, total: byId.size };
}
