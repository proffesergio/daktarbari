import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin, getSupabasePublic } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const postSchema = z.object({
  doctor_id: z.string().min(1, "ভুল ডাক্তার ID"),
  action: z.enum(["confirm", "correct"]),
  phone: z.string().max(20).optional().default(""),
});

// GET ?doctor_id= → counts + latest suggested correction
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("doctor_id") ?? "";
  if (!id) return NextResponse.json({ error: "ID দিন" }, { status: 400 });
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return NextResponse.json({ confirms: 0, corrections: 0, suggested: null, mock: true });
  try {
    const sb = getSupabasePublic();
    const { data } = await sb.from("phone_verifications").select("action,phone,created_at").eq("doctor_id", id).order("created_at", { ascending: false }).limit(100);
    const rows = data ?? [];
    const suggested = rows.find((r) => r.action === "correct" && r.phone)?.phone ?? null;
    return NextResponse.json({
      confirms: rows.filter((r) => r.action === "confirm").length,
      corrections: rows.filter((r) => r.action === "correct").length,
      suggested,
    });
  } catch {
    return NextResponse.json({ confirms: 0, corrections: 0, suggested: null });
  }
}

export async function POST(req: Request) {
  const p = postSchema.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "ভুল তথ্য" }, { status: 400 });
  if (p.data.action === "correct" && !/^01[3-9]\d{8}$/.test(p.data.phone.replace(/[\s-]/g, ""))) {
    return NextResponse.json({ error: "সঠিক ১১ সংখ্যার মোবাইল নম্বর দিন" }, { status: 400 });
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return NextResponse.json({ error: "DB কনফিগার হয়নি" }, { status: 500 });
  try {
    const sb = process.env.SUPABASE_SERVICE_ROLE_KEY ? getSupabaseAdmin() : getSupabasePublic();
    const { error } = await sb.from("phone_verifications").insert({
      doctor_id: p.data.doctor_id,
      action: p.data.action,
      phone: p.data.phone.replace(/[\s-]/g, ""),
    });
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "সংরক্ষণ ব্যর্থ" }, { status: 500 });
  }
}
