import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const addSchema = z.object({
  kind: z.enum(["hospital", "diagnostic"]),
  name_bn: z.string().min(3),
  name_en: z.string().optional().default(""),
  division_bn: z.string().min(2),
  district_bn: z.string().min(2),
  upazila_area: z.string().optional().default(""),
  address_bn: z.string().optional().default(""),
  phone: z.string().optional().default(""),
  hours_bn: z.string().optional().default(""),
});

export async function GET() {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "অননুমোদিত" }, { status: 401 });
  try {
    const sb = getSupabaseAdmin();
    const { data, error } = await sb.from("facilities").select("*").order("created_at", { ascending: false }).limit(100);
    if (error) throw error;
    return NextResponse.json({ facilities: data ?? [] });
  } catch {
    return NextResponse.json({ facilities: [], error: "DB_ERROR" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "অননুমোদিত" }, { status: 401 });
  const p = addSchema.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "ফর্ম ঠিক করুন" }, { status: 400 });
  try {
    const sb = getSupabaseAdmin();
    const id = `${p.data.kind === "hospital" ? "h" : "d"}-${Date.now().toString(36)}`;
    const { error } = await sb.from("facilities").insert({
      id,
      kind: p.data.kind,
      name_bn: p.data.name_bn,
      name_en: p.data.name_en || null,
      division_bn: p.data.division_bn,
      district_bn: p.data.district_bn,
      upazila_area: p.data.upazila_area,
      address_bn: p.data.address_bn,
      phone: p.data.phone,
      hours_bn: p.data.hours_bn || "প্রতিদিন সকাল ৯টা – রাত ৯টা",
    });
    if (error) throw error;
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (/relation|table|column/i.test(msg)) {
      return NextResponse.json({ error: "migration চালান: supabase/migration-2026-10-division-fee-verify-facilities.sql" }, { status: 500 });
    }
    return NextResponse.json({ error: "সংরক্ষণ ব্যর্থ" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "অননুমোদিত" }, { status: 401 });
  const { id } = (await req.json().catch(() => ({}))) as { id?: string };
  if (!id) return NextResponse.json({ error: "ID দিন" }, { status: 400 });
  try {
    const sb = getSupabaseAdmin();
    const { error } = await sb.from("facilities").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "মোছা ব্যর্থ" }, { status: 500 });
  }
}
