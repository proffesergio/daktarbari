import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { syncSheetToDb } from "@/lib/sheetSync";

export const dynamic = "force-dynamic";

// Admin button: pull latest Sheet rows into the DB (dedupe by id).
// Use after editing the Sheet directly — no CRON_SECRET needed (cookie auth).
export async function POST() {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "অননুমোদিত" }, { status: 401 });
  if (!process.env.GOOGLE_SHEET_ID || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ error: "Sheet/DB কনফিগার হয়নি" }, { status: 500 });
  }
  try {
    const { synced, total } = await syncSheetToDb();
    return NextResponse.json({ ok: true, synced, total });
  } catch {
    return NextResponse.json({ error: "Sync ব্যর্থ" }, { status: 500 });
  }
}
