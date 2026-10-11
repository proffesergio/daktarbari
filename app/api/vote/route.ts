import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin, getSupabasePublic } from "@/lib/supabase";
import { rateLimit, clientIpHash, LIMITS } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

const schema = z.object({
  doctor_id: z.string().min(1, "ভুল ডাক্তার ID"),
  kind: z.enum(["up", "down", "report"]),
  reason: z.string().max(500).optional().default(""),
});

const col = { up: "upvotes", down: "downvotes", report: "reports" } as const;

export async function POST(req: Request) {
  const lim = await rateLimit(req, "vote", LIMITS.vote.limit, LIMITS.vote.windowMs);
  if (!lim.ok) return NextResponse.json({ error: "অনেক ভোট — পরে আবার চেষ্টা করুন" }, { status: 429 });
  const body = await req.json().catch(() => null);
  const p = schema.safeParse(body);
  if (!p.success) return NextResponse.json({ error: "ভুল ভোট ডেটা" }, { status: 400 });
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return NextResponse.json({ error: "DB কনফিগার হয়নি" }, { status: 500 });

  try {
    const sb = process.env.SUPABASE_SERVICE_ROLE_KEY ? getSupabaseAdmin() : getSupabasePublic();
    // 1) transparent log (with fraud-signal IP hash)
    await sb.from("doctor_votes").insert({ doctor_id: p.data.doctor_id, kind: p.data.kind, reason: p.data.reason || null, ip_hash: clientIpHash(req) });
    // 2) increment counter (read-then-write, safe for low traffic)
    const { data: cur } = await sb.from("doctors").select("upvotes,downvotes,reports").eq("id", p.data.doctor_id).single();
    if (cur) {
      const k = col[p.data.kind];
      const next = (cur[k] as number ?? 0) + 1;
      // Fraud guard: 5+ reports auto-hides the profile (status → PENDING)
      // until an admin re-reviews it in the approvals queue.
      if (p.data.kind === "report" && next >= 5) {
        await sb.from("doctors").update({ [k]: next, status: "PENDING", verified: false }).eq("id", p.data.doctor_id);
        return NextResponse.json({ ok: true, autoHidden: true });
      }
      await sb.from("doctors").update({ [k]: next }).eq("id", p.data.doctor_id);
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "ভোট সংরক্ষণ ব্যর্থ" }, { status: 500 });
  }
}

