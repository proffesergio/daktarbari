import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { syncSheetToDb } from "@/lib/sheetSync";
import { logSync } from "@/lib/audit";

export const dynamic = "force-dynamic";

// Admin button: import NEW Sheet rows into the DB (DB-wins — existing rows
// are never overwritten, so approvals can't regress).
export async function POST() {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "অননুমোদিত" }, { status: 401 });
  if (!process.env.GOOGLE_SHEET_ID || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ error: "Sheet/DB কনফিগার হয়নি" }, { status: 500 });
  }
  try {
    const { synced, total, skipped } = await syncSheetToDb();
    await logSync("sheet→db(import-new)", total, synced);
    return NextResponse.json({ ok: true, synced, total, skipped });
  } catch (e) {
    const msg = e instanceof Error ? e.message.slice(0, 200) : "Sync ব্যর্থ";
    await logSync("sheet→db(import-new)", 0, 0, msg);
    return NextResponse.json({ error: "Sync ব্যর্থ" }, { status: 500 });
  }
}
