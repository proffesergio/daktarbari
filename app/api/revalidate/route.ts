import { NextResponse } from "next/server";
import { syncSheetToDb } from "@/lib/sheetSync";

export const dynamic = "force-dynamic";

// Cron-safe: Vercel sends Authorization: Bearer <CRON_SECRET> automatically.
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
    const { synced, total } = await syncSheetToDb();
    return NextResponse.json({ ok: true, synced, total });
  } catch {
    return NextResponse.json({ error: "Sync ব্যর্থ" }, { status: 500 });
  }
}
