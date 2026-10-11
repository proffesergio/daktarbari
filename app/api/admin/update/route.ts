import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { upsertApprovedRow, syncSheetStatus } from "@/lib/adminSheets";
import { logAdmin } from "@/lib/audit";
import { parseFeeMin } from "@/lib/fees";

export const dynamic = "force-dynamic";

const scheduleSchema = z.object({ off: z.array(z.string()).optional(), note: z.string().max(200).optional() }).passthrough();

const schema = z.object({
  id: z.string().min(1),
  name_bn: z.string().min(1).max(120).optional(),
  specialty_bn: z.string().min(1).max(80).optional(),
  bmdc_reg_no: z.string().max(40).optional(),
  location_district: z.string().min(1).max(60).optional(),
  location_upazila_area: z.string().max(80).optional(),
  chamber_address_bn: z.string().max(300).optional(),
  appointment_contact: z.string().max(20).optional(),
  visiting_hours_bn: z.string().max(200).optional(),
  visiting_fee_approx: z.string().max(60).optional(),
  verified: z.boolean().optional(),
  consult_available: z.boolean().optional(),
  schedule: scheduleSchema.optional(),
  // unpublish hides the doctor without deleting (status → REJECTED + Sheet mirror)
  unpublish: z.boolean().optional(),
});

// Live-doctor management: edit any field, toggle verified/availability,
// set weekly schedule, or unpublish — all mirrored to the Sheet (DB-wins).
export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "অননুমোদিত" }, { status: 401 });
  const p = schema.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "ভুল তথ্য" }, { status: 400 });
  const { id, unpublish, ...fields } = p.data;
  try {
    const sb = getSupabaseAdmin();
    if (unpublish) {
      await sb.from("doctors").update({ status: "REJECTED" }).eq("id", id);
      await syncSheetStatus(id, "REJECTED");
      await logAdmin("unpublish", id, "");
      return NextResponse.json({ ok: true, unpublished: true });
    }
    if (fields.appointment_contact && !/^01[3-9]\d{8}$/.test(fields.appointment_contact.replace(/[\s\-()]/g, "")))
      return NextResponse.json({ error: "সঠিক ১১ সংখ্যার নম্বর দিন" }, { status: 400 });
    const patch: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(fields)) {
      if (v !== undefined) patch[k] = v;
    }
    if (patch.appointment_contact) patch.appointment_contact = String(patch.appointment_contact).replace(/[\s\-()]/g, "");
    if (patch.visiting_fee_approx !== undefined) patch.fee_min = parseFeeMin(String(patch.visiting_fee_approx));
    if (Object.keys(patch).length === 0) return NextResponse.json({ error: "বদলানোর কিছু নেই" }, { status: 400 });
    const { error } = await sb.from("doctors").update(patch).eq("id", id);
    if (error) throw error;
    let sheet = "skipped";
    try {
      const { data } = await sb.from("doctors").select("*").eq("id", id).maybeSingle();
      if (data) sheet = (await upsertApprovedRow(data)).sheet;
    } catch {
      sheet = "failed";
    }
    await logAdmin("doctor_update", id, `${Object.keys(patch).join(",")} • sheet:${sheet}`);
    return NextResponse.json({ ok: true, sheet });
  } catch {
    return NextResponse.json({ error: "আপডেট ব্যর্থ" }, { status: 500 });
  }
}
