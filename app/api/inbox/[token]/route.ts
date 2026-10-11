import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase";
import { resolveDoctorToken } from "@/lib/doctorTokens";

export const dynamic = "force-dynamic";

// Token-scoped chamber inbox: no admin login needed, only this doctor's requests.
async function doctorId(params: Promise<{ token: string }>) {
  const { token } = await params;
  return resolveDoctorToken(token, "inbox");
}

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const id = await doctorId(params);
  if (!id) return NextResponse.json({ error: "লিংকটি ভুল বা মেয়াদোত্তীর্ণ" }, { status: 401 });
  try {
    const sb = getSupabaseAdmin();
    const [{ data: doc }, { data: reqs }] = await Promise.all([
      sb.from("doctors").select("name_bn,specialty_bn").eq("id", id).maybeSingle(),
      sb.from("serial_requests").select("*").eq("doctor_id", id).order("created_at", { ascending: false }).limit(50),
    ]);
    return NextResponse.json({ doctor: doc ?? null, requests: reqs ?? [] });
  } catch {
    return NextResponse.json({ error: "লোড হয়নি" }, { status: 500 });
  }
}

const schema = z.object({ id: z.string().min(1), action: z.enum(["confirm", "cancel"]) });

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const id = await doctorId(params);
  if (!id) return NextResponse.json({ error: "লিংকটি ভুল বা মেয়াদোত্তীর্ণ" }, { status: 401 });
  const p = schema.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "ভুল তথ্য" }, { status: 400 });
  try {
    const sb = getSupabaseAdmin();
    const status = p.data.action === "confirm" ? "CONFIRMED" : "CANCELLED";
    // Scoped: can only touch own doctor's rows.
    const { data } = await sb.from("serial_requests").update({ status }).eq("id", p.data.id).eq("doctor_id", id).select("id").maybeSingle();
    if (!data) return NextResponse.json({ error: "পাওয়া যায়নি" }, { status: 404 });
    return NextResponse.json({ ok: true, status });
  } catch {
    return NextResponse.json({ error: "ব্যর্থ" }, { status: 500 });
  }
}
