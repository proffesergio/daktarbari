import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin, getSupabasePublic } from "@/lib/supabase";
import { rateLimit, clientIpHash, LIMITS } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

// Helpfulness votes on reviews (toggle, one per IP). Counts are public.
export async function GET(req: Request) {
  const doctor_id = new URL(req.url).searchParams.get("doctor_id") ?? "";
  if (!doctor_id) return NextResponse.json({ counts: {} });
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return NextResponse.json({ counts: {} });
    const sb = process.env.SUPABASE_SERVICE_ROLE_KEY ? getSupabaseAdmin() : getSupabasePublic();
    const { data: reviews } = await sb.from("doctor_reviews").select("id").eq("doctor_id", doctor_id).eq("status", "APPROVED");
    const ids = ((reviews ?? []) as { id: string }[]).map((r) => r.id);
    if (!ids.length) return NextResponse.json({ counts: {} });
    const { data: votes } = await sb.from("review_votes").select("review_id").in("review_id", ids);
    const counts: Record<string, number> = {};
    for (const v of (votes ?? []) as { review_id: string }[]) counts[v.review_id] = (counts[v.review_id] ?? 0) + 1;
    return NextResponse.json({ counts });
  } catch {
    return NextResponse.json({ counts: {} });
  }
}

const schema = z.object({ review_id: z.string().min(1) });

export async function POST(req: Request) {
  const lim = await rateLimit(req, "vote", LIMITS.vote.limit, LIMITS.vote.windowMs);
  if (!lim.ok) return NextResponse.json({ error: "অনেক ভোট — পরে আবার চেষ্টা করুন" }, { status: 429 });
  const p = schema.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "ভুল তথ্য" }, { status: 400 });
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return NextResponse.json({ error: "DB কনফিগার হয়নি" }, { status: 500 });
  try {
    const sb = process.env.SUPABASE_SERVICE_ROLE_KEY ? getSupabaseAdmin() : getSupabasePublic();
    const ip = clientIpHash(req);
    // Toggle: already voted → remove, else add.
    const { data: existing } = await sb.from("review_votes").select("review_id").eq("review_id", p.data.review_id).eq("ip_hash", ip).maybeSingle();
    if (existing) {
      await sb.from("review_votes").delete().eq("review_id", p.data.review_id).eq("ip_hash", ip);
      return NextResponse.json({ ok: true, voted: false });
    }
    const { error } = await sb.from("review_votes").insert({ review_id: p.data.review_id, ip_hash: ip });
    if (error) throw error;
    return NextResponse.json({ ok: true, voted: true });
  } catch {
    return NextResponse.json({ error: "ব্যর্থ" }, { status: 500 });
  }
}

