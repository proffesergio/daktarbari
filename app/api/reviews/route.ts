import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin, getSupabasePublic } from "@/lib/supabase";
import { rateLimit, clientIpHash, LIMITS } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

const schema = z.object({
  doctor_id: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional().default(""),
  patient_name: z.string().max(80).optional().default(""),
});

// Patient review. Lands in PENDING moderation — visible only after admin approval.
export async function POST(req: Request) {
  const lim = await rateLimit(req, "review", LIMITS.review.limit, LIMITS.review.windowMs);
  if (!lim.ok)
    return NextResponse.json({ error: "অনেক রিভিউ — পরে আবার চেষ্টা করুন" }, { status: 429 });
  const p = schema.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "রেটিং দিন (১–৫)" }, { status: 400 });
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL)
    return NextResponse.json({ error: "DB কনফিগার হয়নি" }, { status: 500 });
  try {
    const sb = process.env.SUPABASE_SERVICE_ROLE_KEY ? getSupabaseAdmin() : getSupabasePublic();
    const { error } = await sb.from("doctor_reviews").insert({
      doctor_id: p.data.doctor_id,
      rating: p.data.rating,
      comment: p.data.comment.trim(),
      patient_name: p.data.patient_name.trim(),
      ip_hash: clientIpHash(req),
    });
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "রিভিউ পাঠানো যায়নি" }, { status: 500 });
  }
}

