import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase";
import { resolveDoctorToken } from "@/lib/doctorTokens";
import { upsertApprovedRow } from "@/lib/adminSheets";
import { logAdmin } from "@/lib/audit";
import { parseFeeMin } from "@/lib/fees";

export const dynamic = "force-dynamic";

const schema = z.object({
  chamber_address_bn: z.string().max(300).optional(),
  visiting_hours_bn: z.string().max(200).optional(),
  visiting_fee_approx: z.string().max(60).optional(),
  consult_available: z.boolean().optional(),
  schedule: z.object({ off: z.array(z.string().max(20)).max(7).optional(), note: z.string().max(200).optional(), slots: z.record(z.string(), z.string().max(80)).optional() }).passthrough().optional(),
});

// Doctor self-service update. Token-scoped: only safe fields, never
// name/phone/BMDC (those stay admin-only). Mirrored to Sheet, audit-logged.
export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const doctor_id = await resolveDoctorToken(token, "edit");
  if (!doctor_id) return NextResponse.json({ error: "লিংকটি ভুল বা মেয়াদোত্তীর্ণ" }, { status: 401 });
  const p = schema.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "ভুল তথ্য" }, { status: 400 });
  try {
    const sb = getSupabaseAdmin();
    const patch: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(p.data)) {
      if (v !== undefined) patch[k] = v;
    }
    if (Object.keys(patch).length === 0) return NextResponse.json({ error: "বদলানোর কিছু নেই" }, { status: 400 });
    if (patch.visiting_fee_approx !== undefined) patch.fee_min = parseFeeMin(String(patch.visiting_fee_approx));
    const { error } = await sb.from("doctors").update(patch).eq("id", doctor_id);
    if (error) throw error;
    let sheet = "skipped";
    try {
      const { data } = await sb.from("doctors").select("*").eq("id", doctor_id).maybeSingle();
      if (data) sheet = (await upsertApprovedRow(data)).sheet;
    } catch {
      sheet = "failed";
    }
    await logAdmin("self_edit", doctor_id, Object.keys(patch).join(","));
    return NextResponse.json({ ok: true, sheet });
  } catch {
    return NextResponse.json({ error: "সেভ ব্যর্থ" }, { status: 500 });
  }
}
