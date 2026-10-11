import { getSheetsClient, SHEET_TABS, SHEET_HEADERS } from "@/lib/sheets";

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
// DB-WINS: admin writes go to Postgres first; the Sheet is a mirror.
// REJECTED/DELETED now also stamp/remove the Approved tab row so a later
// Sheet→DB import can never resurrect a rejected doctor.
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
    // REJECTED / DELETED: mirror the decision into the Approved tab too.
    if (status === "REJECTED" || status === "DELETED") {
      await stampApprovedStatus(id, status);
    }
  } catch {
    // ignore — Postgres is source of truth
  }
}

// Stamp column L of an Approved-tab row, or delete the row for DELETED.
// Returns what happened (for sync logs / admin feedback).
export async function stampApprovedStatus(
  id: string,
  status: string,
): Promise<"stamped" | "deleted" | "missing" | "skipped" | "failed"> {
  if (!sheetsReady()) return "skipped";
  try {
    const sheets = getSheetsClient();
    const sid = process.env.GOOGLE_SHEET_ID!;
    const rowNo = await findRowById(sheets, sid, SHEET_TABS.approved, id);
    if (rowNo <= 0) return "missing";
    if (status === "DELETED") {
      // Look up the sheetId (gid) of the Approved tab, then delete the row.
      const meta = await sheets.spreadsheets.get({ spreadsheetId: sid });
      const tab = (meta.data.sheets ?? []).find(
        (s) => s.properties?.title === SHEET_TABS.approved,
      );
      const sheetId = tab?.properties?.sheetId;
      if (sheetId == null) return "failed";
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: sid,
        requestBody: {
          requests: [
            {
              deleteDimension: {
                range: {
                  sheetId,
                  dimension: "ROWS",
                  startIndex: rowNo - 1,
                  endIndex: rowNo,
                },
              },
            },
          ],
        },
      });
      return "deleted";
    }
    await sheets.spreadsheets.values.update({
      spreadsheetId: sid,
      range: `${SHEET_TABS.approved}!L${rowNo}`,
      valueInputOption: "RAW",
      requestBody: { values: [[status]] },
    });
    return "stamped";
  } catch {
    return "failed";
  }
}

export type SheetHealth = {
  env: boolean;
  auth: boolean;
  tabs: { pending: boolean; approved: boolean; reports: boolean };
  headersOk: boolean;
  error: string;
};

// Read-only diagnostics for Admin → সিংক. Never writes.
export async function checkSheetHealth(): Promise<SheetHealth> {
  const bad: SheetHealth = {
    env: false,
    auth: false,
    tabs: { pending: false, approved: false, reports: false },
    headersOk: false,
    error: "",
  };
  if (!process.env.GOOGLE_SHEET_ID || !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
    bad.error = "Google env বসানো হয়নি (SHEET_ID / EMAIL / PRIVATE_KEY)";
    return bad;
  }
  bad.env = true;
  try {
    const sheets = getSheetsClient();
    const sid = process.env.GOOGLE_SHEET_ID!;
    const meta = await sheets.spreadsheets.get({ spreadsheetId: sid });
    const titles = new Set((meta.data.sheets ?? []).map((s) => s.properties?.title));
    bad.tabs = {
      pending: titles.has(SHEET_TABS.pending),
      approved: titles.has(SHEET_TABS.approved),
      reports: titles.has(SHEET_TABS.reports),
    };
    bad.auth = true;
    if (bad.tabs.pending) {
      const h = await sheets.spreadsheets.values.get({
        spreadsheetId: sid,
        range: `${SHEET_TABS.pending}!A1:N1`,
      });
      const got = (h.data.values?.[0] ?? []).map((c) => String(c).trim());
      bad.headersOk =
        SHEET_HEADERS.length === got.length &&
        SHEET_HEADERS.every((c, i) => got[i] === c);
      if (!bad.headersOk) bad.error = `Pending হেডার মিলছে না (পাওয়া: ${got.slice(0, 4).join(",")}…)`;
    } else {
      bad.error = "Pending ট্যাব নেই";
    }
  } catch (e) {
    bad.error = e instanceof Error ? e.message.slice(0, 200) : "Sheet পড়া যায়নি (শেয়ার/কী দেখুন)";
  }
  return bad;
}
