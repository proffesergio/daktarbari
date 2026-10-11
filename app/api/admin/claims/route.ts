import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { logAdmin } from "@/lib/audit";
import { issueDoctorToken } from "@/lib/doctorTokens";

export const dynamic = "force-dynamic";

const schema = z.object({
  id: z.string().min(1),
  action: z.enum(["approve", "reject"]),
});

// Profile-claim review. Approve = caller verified by phone → doctor gets the
// verified badge + a self-edit link (portal) the admin shares with the doctor.
export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "অননুমোদিত" }, { status: 401 });
  const p = schema.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "ভুল তথ্য" }, { status: 400 });
  try {
    const sb = getSupabaseAdmin();
    const status = p.data.action === "approve" ? "APPROVED" : "REJECTED";
    const { data: claim } = await sb.from("profile_claims").update({ status }).eq("id", p.data.id).select("doctor_id").maybeSingle();
    if (!claim) return NextResponse.json({ error: "পাওয়া যায়নি" }, { status: 404 });
    let editToken: string | null = null;
    if (p.data.action === "approve") {
      await sb.from("doctors").update({ verified: true }).eq("id", claim.doctor_id);
      editToken = await issueDoctorToken(claim.doctor_id, "edit", 90);
    }
    await logAdmin(`claim_${p.data.action}`, claim.doctor_id, p.data.id.slice(0, 8));
    const base = process.env.NEXT_PUBLIC_SITE_URL ?? "";
    return NextResponse.json({ ok: true, status, editLink: editToken ? `${base}/edit/${editToken}` : null });
  } catch {
    return NextResponse.json({ error: "ব্যর্থ" }, { status: 500 });
  }
}
