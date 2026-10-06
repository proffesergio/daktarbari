import { getSheetsClient, SHEET_TABS } from "@/lib/sheets";

// Best-effort Sheets sync — never throws to caller
export async function syncSheetStatus(id: string, status: string): Promise<void> {
  try {
    if (!process.env.GOOGLE_SHEET_ID || !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) return;
    const sheets = getSheetsClient();
    const sid = process.env.GOOGLE_SHEET_ID;
    const col = await sheets.spreadsheets.values.get({ spreadsheetId: sid, range: `${SHEET_TABS.pending}!A:A` });
    const idx = (col.data.values ?? []).findIndex((r) => r[0] === id);
    if (idx >= 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: sid,
        range: `${SHEET_TABS.pending}!L${idx + 1}`,
        valueInputOption: "RAW",
        requestBody: { values: [[status]] },
      });
    }
    if (status === "APPROVED" && idx >= 0) {
      const row = await sheets.spreadsheets.values.get({ spreadsheetId: sid, range: `${SHEET_TABS.pending}!A${idx + 1}:N${idx + 1}` });
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
