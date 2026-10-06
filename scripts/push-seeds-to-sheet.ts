// One-off: push local seeds (95) into Google Sheet Pending tab. Skips ids
// already present in Pending/Approved. Run: npx tsx scripts/push-seeds-to-sheet.ts
import * as fs from "fs";
import * as path from "path";
import { SEED_DOCTORS } from "../lib/seed-doctors";
import { QIMP_DOCTORS } from "../lib/seed-qimp14";
import bdd from "../data/bddoctors.json";
import type { Doctor } from "../lib/types";
import { SHEET_HEADERS, SHEET_TABS, getSheetsClient } from "../lib/sheets";

function loadEnv() {
  const f = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(f)) throw new Error(".env.local missing");
  for (const line of fs.readFileSync(f, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!(m[1] in process.env)) process.env[m[1]] = v;
  }
}

async function main() {
  loadEnv();
  const sheets = getSheetsClient();
  const sid = process.env.GOOGLE_SHEET_ID!;
  // 0) ensure required tabs exist (user's sheet may start with a single tab)
  const meta = await sheets.spreadsheets.get({ spreadsheetId: sid });
  const haveTabs = new Set((meta.data.sheets ?? []).map((s) => s.properties?.title));
  const missing = Object.values(SHEET_TABS).filter((t) => !haveTabs.has(t));
  if (missing.length) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: sid,
      requestBody: { requests: missing.map((title) => ({ addSheet: { properties: { title } } })) },
    });
    console.log("tabs created: " + missing.join(", "));
  }
  // 1) header row
  const h = await sheets.spreadsheets.values.get({ spreadsheetId: sid, range: `${SHEET_TABS.pending}!A1:N1` });
  if (!(h.data.values?.[0]?.length)) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: sid,
      range: `${SHEET_TABS.pending}!A1:N1`,
      valueInputOption: "RAW",
      requestBody: { values: [[...SHEET_HEADERS]] },
    });
    console.log("header written");
  }
  // 2) existing ids
  const [pe, ap] = await Promise.all([
    sheets.spreadsheets.values.get({ spreadsheetId: sid, range: `${SHEET_TABS.pending}!A:A` }),
    sheets.spreadsheets.values.get({ spreadsheetId: sid, range: `${SHEET_TABS.approved}!A:A` }),
  ]);
  const have = new Set([...(pe.data.values ?? []), ...(ap.data.values ?? [])].map((r) => r[0]));
  const fresh = [...SEED_DOCTORS, ...QIMP_DOCTORS, ...(bdd as Doctor[])].filter((d) => !have.has(d.id));
  const total = SEED_DOCTORS.length + QIMP_DOCTORS.length + (bdd as Doctor[]).length;
  console.log(`total=${total} already=${have.size} fresh=${fresh.length}`);
  if (!fresh.length) return;
  for (let i = 0; i < fresh.length; i += 200) {
    const chunk = fresh.slice(i, i + 200);
    await sheets.spreadsheets.values.append({
      spreadsheetId: sid,
      range: `${SHEET_TABS.pending}!A:N`,
      valueInputOption: "RAW",
      requestBody: {
        values: chunk.map((d) => [d.id, d.name_bn, d.name_en ?? "", d.specialty_bn, d.bmdc_reg_no ?? "", d.location_district, d.location_upazila_area, d.chamber_address_bn, d.appointment_contact, d.visiting_hours_bn, d.visiting_fee_approx, "PENDING", d.created_at, (d as { photo_url?: string }).photo_url ?? ""]),
      },
    });
    console.log(`appended ${Math.min(i + 200, fresh.length)}/${fresh.length}`);
  }
}

main().catch((e) => { console.error("FAILED:", e.message); process.exit(1); });
