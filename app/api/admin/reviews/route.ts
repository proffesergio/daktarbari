import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { logAdmin } from "@/lib/audit";

export const dynamic = "force-dynamic";

const schema = z.object({
  id: z.string().min(1).optional(),
  action: z.enum(["approve", "reject", "reject_ip"]),
  ip_hash: z.string().max(32).optional(),
});

// Review moderation: approve shows it on the profile, reject hides it,
// reject_ip nukes every pending review from one abusive IP.
export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "অননুমোদিত" }, { status: 401 });
  const p = schema.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "ভুল তথ্য" }, { status: 400 });
  try {
    const sb = getSupabaseAdmin();
    if (p.data.action === "reject_ip") {
      if (!p.data.ip_hash) return NextResponse.json({ error: "IP দিন" }, { status: 400 });
      const { data } = await sb.from("doctor_reviews").update({ status: "REJECTED" }).eq("ip_hash", p.data.ip_hash).eq("status", "PENDING").select("id");
      await logAdmin("review_reject_ip", null, `${p.data.ip_hash.slice(0, 8)} • ${(data ?? []).length}টি`);
      return NextResponse.json({ ok: true, rejected: (data ?? []).length });
    }
    if (!p.data.id) return NextResponse.json({ error: "ID দিন" }, { status: 400 });
    const status = p.data.action === "approve" ? "APPROVED" : "REJECTED";
    const { data } = await sb.from("doctor_reviews").update({ status }).eq("id", p.data.id).select("doctor_id").maybeSingle();
    if (!data) return NextResponse.json({ error: "পাওয়া যায়নি" }, { status: 404 });
    await logAdmin(`review_${p.data.action}`, data.doctor_id, p.data.id.slice(0, 8));
    return NextResponse.json({ ok: true, status });
  } catch {
    return NextResponse.json({ error: "ব্যর্থ" }, { status: 500 });
  }
}
