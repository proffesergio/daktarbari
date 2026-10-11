import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin, getSupabasePublic } from "@/lib/supabase";
import { rateLimit, clientIpHash, LIMITS } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

const schema = z.object({
  doctor_id: z.string().min(1),
  claimant_name: z.string().min(2, "আপনার নাম দিন").max(80),
  claimant_phone: z
    .string()
    .transform((s) => s.replace(/[\s\-()]/g, ""))
    .pipe(z.string().regex(/^01[3-9]\d{8}$/, "সঠিক ১১ সংখ্যার মোবাইল নম্বর দিন")),
  note: z.string().max(300).optional().default(""),
});

// "This is my profile" claim. Admin verifies via phone call, then marks
// the doctor verified + records availability. No self-edit until verified.
export async function POST(req: Request) {
  const lim = await rateLimit(req, "claim", LIMITS.claim.limit, LIMITS.claim.windowMs);
  if (!lim.ok) return NextResponse.json({ error: "ইতিমধ্যে অনুরোধ গেছে — যাচাই চলছে" }, { status: 429 });
  const p = schema.safeParse(await req.json().catch(() => null));
  if (!p.success)
    return NextResponse.json({ error: p.error.issues[0]?.message ?? "ফর্ম ঠিক করুন" }, { status: 400 });
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL)
    return NextResponse.json({ error: "DB কনফিগার হয়নি" }, { status: 500 });
  try {
    const sb = process.env.SUPABASE_SERVICE_ROLE_KEY ? getSupabaseAdmin() : getSupabasePublic();
    const { error } = await sb.from("profile_claims").insert({
      doctor_id: p.data.doctor_id,
      claimant_name: p.data.claimant_name.trim(),
      claimant_phone: p.data.claimant_phone,
      note: p.data.note.trim(),
      ip_hash: clientIpHash(req),
    });
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "অনুরোধ পাঠানো যায়নি" }, { status: 500 });
  }
}

