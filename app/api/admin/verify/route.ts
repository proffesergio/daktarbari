import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { upsertApprovedRow } from "@/lib/adminSheets";
import { logAdmin } from "@/lib/audit";
import { parseFeeMin } from "@/lib/fees";

export const dynamic = "force-dynamic";

// Field mapping: verification target → doctors column.
const TARGET_COL: Record<string, string> = {
  phone: "appointment_contact",
  chamber: "chamber_address_bn",
  fee: "visiting_fee_approx",
  hours: "visiting_hours_bn",
  bmdc: "bmdc_reg_no",
};

const schema = z.object({
  action: z.enum(["apply", "dismiss"]),
  // verification row ids this decision covers (may be empty when the admin
  // types a corrected value directly with no queued submission)
  verification_ids: z.array(z.string().min(1)).max(50),
  doctor_id: z.string().min(1),
  target: z.enum(["phone", "chamber", "fee", "hours", "bmdc", "general"]),
  // required for apply (except general notes): the value to write
  value: z.string().max(300).optional().default(""),
});

// Admin reviews a correction: apply it to the doctor profile (+ Sheet mirror)
// or dismiss it. Marks the covered verification rows reviewed.
export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "অননুমোদিত" }, { status: 401 });
  const p = schema.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "ভুল তথ্য" }, { status: 400 });
  const { action, verification_ids, doctor_id, target, value } = p.data;

  if (action === "apply") {
    const col = TARGET_COL[target];
    if (!col) return NextResponse.json({ error: "general নোট সরাসরি apply হয় না — dismiss করুন" }, { status: 400 });
    const clean = target === "phone" ? value.replace(/[\s\-()]/g, "") : value.trim();
    if (target === "phone" && !/^01[3-9]\d{8}$/.test(clean))
      return NextResponse.json({ error: "সঠিক ১১ সংখ্যার নম্বর দিন" }, { status: 400 });
    if (!clean) return NextResponse.json({ error: "মান লিখুন" }, { status: 400 });
    try {
      const sb = getSupabaseAdmin();
      const patch: Record<string, unknown> = { [col]: clean };
      if (target === "fee") patch.fee_min = parseFeeMin(clean);
      const { error } = await sb.from("doctors").update(patch).eq("id", doctor_id);
      if (error) throw error;
      if (verification_ids.length)
        await sb.from("doctor_verifications").update({ reviewed: true }).in("id", verification_ids);
      // DB-wins: mirror the corrected row into the Sheet.
      let sheet: string = "skipped";
      try {
        const { data } = await sb.from("doctors").select("*").eq("id", doctor_id).maybeSingle();
        if (data) sheet = (await upsertApprovedRow(data)).sheet;
      } catch {
        sheet = "failed";
      }
      await logAdmin("verify_apply", doctor_id, `${target} → “${clean.slice(0, 80)}” • sheet:${sheet}`);
      return NextResponse.json({ ok: true, sheet });
    } catch {
      return NextResponse.json({ error: "Apply ব্যর্থ" }, { status: 500 });
    }
  }

  // dismiss
  try {
    const sb = getSupabaseAdmin();
    if (verification_ids.length)
      await sb.from("doctor_verifications").update({ reviewed: true }).in("id", verification_ids);
    await logAdmin("verify_dismiss", doctor_id, `${target} • ${verification_ids.length}টি`);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Dismiss ব্যর্থ" }, { status: 500 });
  }
}
