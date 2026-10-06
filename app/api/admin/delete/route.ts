import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { syncSheetStatus } from "@/lib/adminSheets";

export const dynamic = "force-dynamic";
const schema = z.object({ id: z.string().uuid() });

export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "অননুমোদিত" }, { status: 401 });
  const p = schema.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "ভুল ID" }, { status: 400 });
  try {
    const sb = getSupabaseAdmin();
    await sb.from("doctor_votes").delete().eq("doctor_id", p.data.id);
    const { error } = await sb.from("doctors").delete().eq("id", p.data.id);
    if (error) throw error;
    await syncSheetStatus(p.data.id, "DELETED");
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Delete ব্যর্থ" }, { status: 500 });
  }
}
