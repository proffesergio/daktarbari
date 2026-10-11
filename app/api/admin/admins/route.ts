import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminActor, hashAdminToken } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { logAdmin } from "@/lib/audit";

export const dynamic = "force-dynamic";

// Named-admin management (master or any active admin can manage).
export async function GET() {
  const actor = await getAdminActor();
  if (!actor) return NextResponse.json({ error: "অননুমোদিত" }, { status: 401 });
  try {
    const sb = getSupabaseAdmin();
    const { data } = await sb.from("admins").select("id,name,active,created_at").order("created_at");
    return NextResponse.json({ admins: data ?? [], you: actor });
  } catch {
    return NextResponse.json({ admins: [], you: actor, missing_table: true });
  }
}

const addSchema = z.object({ name: z.string().min(2).max(40) });

// Create: generates a token, stores only its hash, returns plain token ONCE.
export async function POST(req: Request) {
  const actor = await getAdminActor();
  if (!actor) return NextResponse.json({ error: "অননুমোদিত" }, { status: 401 });
  const p = addSchema.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "নাম দিন (২–৪০ অক্ষর)" }, { status: 400 });
  try {
    const sb = getSupabaseAdmin();
    const token = `db_${randomBytes(18).toString("base64url")}`;
    const { error } = await sb.from("admins").insert({ name: p.data.name.trim(), token_hash: hashAdminToken(token) });
    if (error) {
      if (/duplicate|unique/i.test(error.message)) return NextResponse.json({ error: "এই নামে অ্যাডমিন আছে" }, { status: 400 });
      throw error;
    }
    await logAdmin("admin_add", null, p.data.name.trim());
    return NextResponse.json({ ok: true, name: p.data.name.trim(), token });
  } catch {
    return NextResponse.json({ error: "তৈরি হয়নি (migration দেখুন)" }, { status: 500 });
  }
}

const toggleSchema = z.object({ id: z.string().min(1), active: z.boolean() });

// Deactivate/reactivate (master token itself can't be deactivated — it's env).
export async function PATCH(req: Request) {
  const actor = await getAdminActor();
  if (!actor) return NextResponse.json({ error: "অননুমোদিত" }, { status: 401 });
  const p = toggleSchema.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "ভুল তথ্য" }, { status: 400 });
  try {
    const sb = getSupabaseAdmin();
    const { data } = await sb.from("admins").update({ active: p.data.active }).eq("id", p.data.id).select("name").maybeSingle();
    if (data) await logAdmin(p.data.active ? "admin_reactivate" : "admin_deactivate", null, data.name as string);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "ব্যর্থ" }, { status: 500 });
  }
}
