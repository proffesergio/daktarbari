import { NextResponse } from "next/server";
import { isValidAdminToken, ADMIN_COOKIE } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { token } = await req.json().catch(() => ({ token: "" }));
  if (!isValidAdminToken(String(token ?? ""))) {
    return NextResponse.json({ error: "ভুল টোকেন" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, String(token), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
