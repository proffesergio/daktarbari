import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin, getSupabasePublic } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const schema = z.object({
  doctor_id: z.string().uuid("ভুল ডাক্তার ID"),
  kind: z.enum(["up", "down", "report"]),
  reason: z.string().max(500).optional().default(""),
});

const col = { up: "upvotes", down: "downvotes", report: "reports" } as const;

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const p = schema.safeParse(body);
  if (!p.success) return NextResponse.json({ error: "ভুল ভোট ডেটা" }, { status: 400 });
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return NextResponse.json({ error: "DB কনফিগার হয়নি" }, { status: 500 });

  try {
    const sb = process.env.SUPABASE_SERVICE_ROLE_KEY ? getSupabaseAdmin() : getSupabasePublic();
    // 1) transparent log
    await sb.from("doctor_votes").insert({ doctor_id: p.data.doctor_id, kind: p.data.kind, reason: p.data.reason || null });
    // 2) increment counter (read-then-write, safe for low traffic)
    const { data: cur } = await sb.from("doctors").select("upvotes,downvotes,reports").eq("id", p.data.doctor_id).single();
    if (cur) {
      const k = col[p.data.kind];
      await sb.from("doctors").update({ [k]: (cur[k] as number ?? 0) + 1 }).eq("id", p.data.doctor_id);
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "ভোট সংরক্ষণ ব্যর্থ" }, { status: 500 });
  }
}
