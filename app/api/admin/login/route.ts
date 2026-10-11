import { NextResponse } from "next/server";
import { isValidAdminToken, hashAdminToken, ADMIN_COOKIE } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { token, name } = await req.json().catch(() => ({ token: "", name: "" }));
  const raw = String(token ?? "");
  let ok = isValidAdminToken(raw);
  let actor = "master";
  // Named admin: { name, token } checked against admins table.
  if (!ok && name && raw) {
    try {
      const sb = getSupabaseAdmin();
      const { data } = await sb.from("admins").select("name,active").eq("name", String(name)).eq("token_hash", hashAdminToken(raw)).maybeSingle();
      if (data && data.active) {
        ok = true;
        actor = data.name as string;
      }
    } catch {
      ok = false;
    }
  }
  if (!ok) {
    return NextResponse.json({ error: "ভুল নাম/টোকেন" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true, actor });
  res.cookies.set(ADMIN_COOKIE, raw, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
