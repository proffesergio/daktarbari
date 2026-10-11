import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { trySendNotification } from "@/lib/notify";

export const dynamic = "force-dynamic";

const schema = z.object({ id: z.string().min(1) });

// Retry a queued/failed notification (after configuring SMS/WhatsApp env).
export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "অননুমোদিত" }, { status: 401 });
  const p = schema.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "ভুল তথ্য" }, { status: 400 });
  const ok = await trySendNotification(p.data.id);
  if (ok) return NextResponse.json({ ok: true });
  const sb = getSupabaseAdmin();
  const { data } = await sb.from("notifications").select("error").eq("id", p.data.id).maybeSingle();
  return NextResponse.json({ error: (data?.error as string) || "পাঠানো যায়নি" }, { status: 500 });
}

export async function GET() {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "অননুমোদিত" }, { status: 401 });
  try {
    const sb = getSupabaseAdmin();
    const { data } = await sb.from("notifications").select("id,channel,to_phone,body,status,error,created_at").order("created_at", { ascending: false }).limit(20);
    return NextResponse.json({ notifications: data ?? [] });
  } catch {
    return NextResponse.json({ notifications: [] });
  }
}
