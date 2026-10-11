import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const ALLOWED_KEYS = ["map_tile_url", "map_attribution", "map_api_key"] as const;

const saveSchema = z.object({
  key: z.enum(ALLOWED_KEYS),
  value: z.string().max(2000),
});

// Admin-only key-value settings (map tile URL, attribution, future API keys).
export async function GET() {
  if (!(await isAdminAuthenticated()))
    return NextResponse.json({ error: "অননুমোদিত" }, { status: 401 });
  try {
    const sb = getSupabaseAdmin();
    const { data, error } = await sb
      .from("site_settings")
      .select("key,value,updated_at")
      .in("key", [...ALLOWED_KEYS]);
    if (error) {
      // Table missing = migration not run yet — return env fallback with hint.
      if ((error as { code?: string }).code === "42P01") {
        return NextResponse.json({
          settings: {},
          missing_table: true,
          hint: "supabase/migration-2026-10-site-settings.sql চালান",
        });
      }
      throw error;
    }
    const settings: Record<string, string> = {};
    for (const r of (data ?? []) as { key: string; value: string }[]) {
      // Never send full API key to browser? Admin needs to see/edit it —
      // admin is already authenticated via ADMIN_TOKEN, so allow it.
      settings[r.key] = r.value;
    }
    return NextResponse.json({ settings });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "ব্যর্থ" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  if (!(await isAdminAuthenticated()))
    return NextResponse.json({ error: "অননুমোদিত" }, { status: 401 });
  const p = saveSchema.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "ভুল তথ্য" }, { status: 400 });
  try {
    const sb = getSupabaseAdmin();
    const { error } = await sb.from("site_settings").upsert(
      { key: p.data.key, value: p.data.value, updated_at: new Date().toISOString() },
      { onConflict: "key" },
    );
    if (error) {
      if ((error as { code?: string }).code === "42P01") {
        return NextResponse.json(
          { error: "site_settings টেবিল নেই — supabase/migration-2026-10-site-settings.sql চালান" },
          { status: 500 },
        );
      }
      throw error;
    }
    return NextResponse.json({ ok: true, key: p.data.key });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "ব্যর্থ" },
      { status: 500 },
    );
  }
}
