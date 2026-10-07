import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin, getSupabasePublic } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const postSchema = z.object({
  doctor_id: z.string().min(1),
  target: z.enum(["phone", "chamber", "fee", "hours", "bmdc", "general"]),
  action: z.enum(["confirm", "correct"]),
  note: z.string().max(300).optional().default(""),
});

// GET ?doctor_id= → per-target counts + latest correction note
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("doctor_id") ?? "";
  if (!id) return NextResponse.json({ error: "ID দিন" }, { status: 400 });
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL)
    return NextResponse.json({ targets: {}, mock: true });
  try {
    const sb = getSupabasePublic();
    // New table first, fallback to legacy phone_verifications
    const { data: v2 } = await sb
      .from("doctor_verifications")
      .select("target,action,note,created_at")
      .eq("doctor_id", id)
      .order("created_at", { ascending: false })
      .limit(200);
    if (v2 && v2.length > 0) {
      const targets: Record<string, { confirms: number; corrections: number; suggested: string | null }> = {};
      for (const r of v2) {
        targets[r.target] ??= { confirms: 0, corrections: 0, suggested: null };
        if (r.action === "confirm") targets[r.target].confirms++;
        else {
          targets[r.target].corrections++;
          if (!targets[r.target].suggested && r.note) targets[r.target].suggested = r.note;
        }
      }
      return NextResponse.json({ targets });
    }
    // Legacy fallback
    const { data } = await sb
      .from("phone_verifications")
      .select("action,phone,created_at")
      .eq("doctor_id", id)
      .order("created_at", { ascending: false })
      .limit(100);
    const rows = data ?? [];
    return NextResponse.json({
      targets: {
        phone: {
          confirms: rows.filter((r) => r.action === "confirm").length,
          corrections: rows.filter((r) => r.action === "correct").length,
          suggested: rows.find((r) => r.action === "correct" && r.phone)?.phone ?? null,
        },
      },
    });
  } catch {
    return NextResponse.json({ targets: {} });
  }
}

export async function POST(req: Request) {
  const p = postSchema.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "ভুল তথ্য" }, { status: 400 });
  const { doctor_id, target, action, note } = p.data;
  const clean = note.replace(/[\s\-()]/g, "");
  if (action === "correct" && target === "phone" && !/^01[3-9]\d{8}$/.test(clean)) {
    return NextResponse.json({ error: "সঠিক ১১ সংখ্যার মোবাইল নম্বর দিন" }, { status: 400 });
  }
  if (action === "correct" && !note.trim()) {
    return NextResponse.json({ error: "সঠিক তথ্য লিখুন" }, { status: 400 });
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL)
    return NextResponse.json({ error: "DB কনফিগার হয়নি" }, { status: 500 });
  try {
    const sb = process.env.SUPABASE_SERVICE_ROLE_KEY ? getSupabaseAdmin() : getSupabasePublic();
    // Try new table, fallback to legacy phone table for phone confirms
    const { error } = await sb.from("doctor_verifications").insert({
      doctor_id,
      target,
      action,
      note: target === "phone" ? clean : note.trim(),
    });
    if (error) {
      if (target !== "phone") throw error;
      // legacy fallback
      const fb = await sb.from("phone_verifications").insert({
        doctor_id,
        action,
        phone: action === "correct" ? clean : "",
      });
      if (fb.error) throw fb.error;
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "সংরক্ষণ ব্যর্থ" }, { status: 500 });
  }
}
