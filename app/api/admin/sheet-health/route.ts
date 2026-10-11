import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { checkSheetHealth } from "@/lib/adminSheets";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// Read-only Sheet diagnostics + recent sync history for Admin → সিংক.
export async function GET() {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "অননুমোদিত" }, { status: 401 });
  const health = await checkSheetHealth();
  let history: { direction: string; total: number; ok_count: number; error: string; created_at: string }[] = [];
  try {
    const sb = getSupabaseAdmin();
    const { data } = await sb.from("sync_logs").select("direction,total,ok_count,error,created_at").order("created_at", { ascending: false }).limit(10);
    history = (data ?? []) as typeof history;
  } catch {
    history = [];
  }
  return NextResponse.json({ health, history });
}
