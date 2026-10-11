import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { logAdmin } from "@/lib/audit";

export const dynamic = "force-dynamic";

const schema = z.object({
  id: z.string().min(1),
  action: z.enum(["confirm", "cancel"]),
});

// Chamber inbox: confirm or cancel a serial / consultation request.
export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "অননুমোদিত" }, { status: 401 });
  const p = schema.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "ভুল তথ্য" }, { status: 400 });
  try {
    const sb = getSupabaseAdmin();
    const status = p.data.action === "confirm" ? "CONFIRMED" : "CANCELLED";
    const { data } = await sb.from("serial_requests").update({ status }).eq("id", p.data.id).select("doctor_id").maybeSingle();
    if (!data) return NextResponse.json({ error: "পাওয়া যায়নি" }, { status: 404 });
    await logAdmin(`serial_${p.data.action}`, data.doctor_id, p.data.id.slice(0, 8));
    return NextResponse.json({ ok: true, status });
  } catch {
    return NextResponse.json({ error: "ব্যর্থ" }, { status: 500 });
  }
}
