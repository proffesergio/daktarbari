import { getSheetsClient, SHEET_TABS } from "@/lib/sheets";

export type DoctorSheetRow = {
  id: string;
  name_bn: string;
  name_en: string | null;
  specialty_bn: string;
  bmdc_reg_no: string | null;
  location_district: string;
  location_upazila_area: string;
  chamber_address_bn: string;
  appointment_contact: string;
  visiting_hours_bn: string;
  visiting_fee_approx: string;
  status: string;
  created_at: string;
  photo_url?: string | null;
};

// DB row (verified info) → Sheet columns A:N.
// Column order must match SHEET_HEADERS in lib/sheets.ts.
export function doctorToSheetRow(d: DoctorSheetRow): string[] {
  return [
    d.id,
    d.name_bn ?? "",
    d.name_en ?? "",
    d.specialty_bn ?? "",
    d.bmdc_reg_no ?? "",
    d.location_district ?? "",
    d.location_upazila_area ?? "",
    d.chamber_address_bn ?? "",
    d.appointment_contact ?? "",
    d.visiting_hours_bn ?? "",
    d.visiting_fee_approx ?? "",
    "APPROVED",
    d.created_at ?? new Date().toISOString(),
    d.photo_url ?? "",
  ];
}

function sheetsReady(): boolean {
  return !!process.env.GOOGLE_SHEET_ID && !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
}

// 1-indexed row number of id in column A of tab, or -1.
async function findRowById(
  sheets: ReturnType<typeof getSheetsClient>,
  sid: string,
  tab: string,
  id: string,
): Promise<number> {
  const col = await sheets.spreadsheets.values.get({
    spreadsheetId: sid,
    range: `${tab}!A:A`,
  });
  return (col.data.values ?? []).findIndex((r) => r[0] === id) + 1;
}

// Upsert the VERIFIED doctor record into the Approved tab (update if the id
// already exists, else append — never duplicates), and stamp the Pending tab
// status so both tabs agree. Returns how the Sheet write went.
export async function upsertApprovedRow(
  d: DoctorSheetRow,
): Promise<{ sheet: "updated" | "appended" | "skipped" | "failed" }> {
  if (!sheetsReady()) return { sheet: "skipped" };
  try {
    const sheets = getSheetsClient();
    const sid = process.env.GOOGLE_SHEET_ID!;
    const row = doctorToSheetRow(d);

    const existing = await findRowById(sheets, sid, SHEET_TABS.approved, d.id);
    if (existing > 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: sid,
        range: `${SHEET_TABS.approved}!A${existing}:N${existing}`,
        valueInputOption: "RAW",
        requestBody: { values: [row] },
      });
    } else {
      await sheets.spreadsheets.values.append({
        spreadsheetId: sid,
        range: `${SHEET_TABS.approved}!A:N`,
        valueInputOption: "RAW",
        requestBody: { values: [row] },
      });
    }

    // Keep Pending tab in agreement (status column L) where the row exists.
    try {
      const pend = await findRowById(sheets, sid, SHEET_TABS.pending, d.id);
      if (pend > 0) {
        await sheets.spreadsheets.values.update({
          spreadsheetId: sid,
          range: `${SHEET_TABS.pending}!L${pend}`,
          valueInputOption: "RAW",
          requestBody: { values: [["APPROVED"]] },
        });
      }
    } catch {
      // Approved write already succeeded — Pending stamp is best-effort.
    }
    return { sheet: existing > 0 ? "updated" : "appended" };
  } catch {
    return { sheet: "failed" };
  }
}

// Legacy single-id entrypoint kept for the old approve route shape.
// Prefers a caller-supplied verified row; falls back to stamping status only.
export async function syncSheetStatus(
  id: string,
  status: string,
  verified?: DoctorSheetRow,
): Promise<void> {
  try {
    if (!sheetsReady()) return;
    if (status === "APPROVED" && verified) {
      await upsertApprovedRow(verified);
      return;
    }
    const sheets = getSheetsClient();
    const sid = process.env.GOOGLE_SHEET_ID!;
    const idx = await findRowById(sheets, sid, SHEET_TABS.pending, id);
    if (idx > 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: sid,
        range: `${SHEET_TABS.pending}!L${idx}`,
        valueInputOption: "RAW",
        requestBody: { values: [[status]] },
      });
    }
    if (status === "APPROVED" && idx > 0) {
      const row = await sheets.spreadsheets.values.get({
        spreadsheetId: sid,
        range: `${SHEET_TABS.pending}!A${idx}:N${idx}`,
      });
      const vals = row.data.values?.[0];
      if (vals) {
        vals[11] = "APPROVED";
        await sheets.spreadsheets.values.append({
          spreadsheetId: sid,
          range: `${SHEET_TABS.approved}!A:N`,
          valueInputOption: "RAW",
          requestBody: { values: [vals] },
        });
      }
    }
  } catch {
    // ignore — Postgres is source of truth
  }
}
