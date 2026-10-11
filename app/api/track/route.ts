import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase";
import { rateLimit, clientIpHash, LIMITS } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

const schema = z.object({
  kind: z.enum(["profile_view", "call_tap", "whatsapp_tap", "search", "serial_submit", "review_submit"]),
  doctor_id: z.string().max(100).nullable().optional(),
  query: z.string().max(200).optional().default(""),
  meta: z.string().max(500).optional().default(""),
});

// Fire-and-forget activity beacon. Always 200 (never break UX); table
// missing pre-migration is silently ignored.
export async function POST(req: Request) {
  const lim = await rateLimit(req, "track", LIMITS.track.limit, LIMITS.track.windowMs);
  if (!lim.ok) return NextResponse.json({ ok: true, limited: true });
  let body: unknown = null;
  try {
    const text = await req.text();
    body = text ? JSON.parse(text) : null;
  } catch {
    body = null;
  }
  const p = schema.safeParse(body);
  if (!p.success) return NextResponse.json({ ok: true, ignored: true });
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY)
      return NextResponse.json({ ok: true, ignored: true });
    const sb = getSupabaseAdmin();
    await sb.from("events").insert({
      kind: p.data.kind,
      doctor_id: p.data.doctor_id || null,
      query: p.data.query,
      meta: p.data.meta,
      ip_hash: clientIpHash(req),
    });
  } catch {
    /* analytics never blocks */
  }
  return NextResponse.json({ ok: true });
}

