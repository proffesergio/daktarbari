import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { logAdmin } from "@/lib/audit";

export const dynamic = "force-dynamic";

const schema = z.object({
  doctor_id: z.string().min(1),
  action: z.enum(["resolve", "unpublish"]),
});

// Reports triage. resolve = reports cleared, doctor stays live + verified.
// unpublish = hide until re-reviewed.
export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "অননুমোদিত" }, { status: 401 });
  const p = schema.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "ভুল তথ্য" }, { status: 400 });
  try {
    const sb = getSupabaseAdmin();
    if (p.data.action === "resolve") {
      await sb.from("doctors").update({ reports: 0, verified: true }).eq("id", p.data.doctor_id);
    } else {
      const { syncSheetStatus } = await import("@/lib/adminSheets");
      await sb.from("doctors").update({ status: "REJECTED" }).eq("id", p.data.doctor_id);
      await syncSheetStatus(p.data.doctor_id, "REJECTED");
    }
    await logAdmin(`reports_${p.data.action}`, p.data.doctor_id, "");
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "ব্যর্থ" }, { status: 500 });
  }
}
