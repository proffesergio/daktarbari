import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { upsertApprovedRow } from "@/lib/adminSheets";

export const dynamic = "force-dynamic";
// TEXT ids (UUIDs + seed-*/qimp-*/bnc-*/bd-* all share one key space)
const schema = z.object({ id: z.string().min(1) });

export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "অননুমোদিত" }, { status: 401 });
  const p = schema.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "ভুল ID" }, { status: 400 });
  try {
    const sb = getSupabaseAdmin();
    const { error } = await sb.from("doctors").update({ status: "APPROVED" }).eq("id", p.data.id);
    if (error) throw error;
    // Re-read the row so the Sheet gets the VERIFIED info (admin edits included)
    const { data } = await sb.from("doctors").select("*").eq("id", p.data.id).maybeSingle();
    const { sheet } = data ? await upsertApprovedRow(data) : { sheet: "failed" as const };
    return NextResponse.json({ ok: true, sheet });
  } catch {
    return NextResponse.json({ error: "Approve ব্যর্থ" }, { status: 500 });
  }
}
