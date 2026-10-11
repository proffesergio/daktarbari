import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase";
import { requestOtp, verifyOtp } from "@/lib/otp";
import { issueDoctorToken } from "@/lib/doctorTokens";
import { logAdmin } from "@/lib/audit";
import { rateLimit, LIMITS } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

const phoneSchema = z.string().transform((s) => s.replace(/[\s\-()]/g, "")).pipe(z.string().regex(/^01[3-9]\d{8}$/));

// Step 1 — request: { step: "request", phone }
// Step 2 — verify: { step: "verify", phone, code, doctor_id, claimant_name, note? }
// Verified OTP proves phone ownership → claim auto-approved with edit link.
export async function POST(req: Request) {
  const lim = await rateLimit(req, "claim", LIMITS.claim.limit, LIMITS.claim.windowMs);
  if (!lim.ok) return NextResponse.json({ error: "অনেক চেষ্টা — পরে আবার করুন" }, { status: 429 });
  const body = await req.json().catch(() => null);
  const step = (body as { step?: string })?.step;

  if (step === "request") {
    const p = phoneSchema.safeParse((body as { phone?: string })?.phone);
    if (!p.success) return NextResponse.json({ error: "সঠিক ১১ সংখ্যার মোবাইল নম্বর দিন" }, { status: 400 });
    const r = await requestOtp(p.data);
    if (!r.ok) return NextResponse.json({ error: r.error ?? "পাঠানো যায়নি" }, { status: 429 });
    return NextResponse.json({ ok: true });
  }

  if (step === "verify") {
    const p = z.object({
      phone: phoneSchema,
      code: z.string().min(4).max(8),
      doctor_id: z.string().min(1),
      claimant_name: z.string().min(2).max(80),
      note: z.string().max(300).optional().default(""),
    }).safeParse(body);
    if (!p.success) return NextResponse.json({ error: "তথ্য ঠিক করুন" }, { status: 400 });
    const good = await verifyOtp(p.data.phone, p.data.code);
    if (!good) return NextResponse.json({ error: "কোড ভুল বা মেয়াদোত্তীর্ণ" }, { status: 400 });
    try {
      const sb = getSupabaseAdmin();
      await sb.from("profile_claims").insert({
        doctor_id: p.data.doctor_id,
        claimant_name: p.data.claimant_name.trim(),
        claimant_phone: p.data.phone,
        note: `OTP-যাচাইকৃত${p.data.note ? ` • ${p.data.note}` : ""}`,
        status: "APPROVED",
      });
      await sb.from("doctors").update({ verified: true }).eq("id", p.data.doctor_id);
      const editToken = await issueDoctorToken(p.data.doctor_id, "edit", 90);
      await logAdmin("claim_otp_approve", p.data.doctor_id, p.data.phone, "otp");
      const base = process.env.NEXT_PUBLIC_SITE_URL ?? "";
      return NextResponse.json({ ok: true, editLink: editToken ? `${base}/edit/${editToken}` : null });
    } catch {
      return NextResponse.json({ error: "সংরক্ষণ ব্যর্থ" }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "ভুল ধাপ" }, { status: 400 });
}

