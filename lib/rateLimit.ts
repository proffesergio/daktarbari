import { createHash } from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase";

// Rate limiting: DB-backed buckets (multi-instance safe) with per-instance
// memory fallback when the table/env is missing. Keyed by IP hash + tag.
const memBuckets = new Map<string, number[]>();

export function clientIpHash(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
  const ip = fwd || req.headers.get("x-real-ip")?.trim() || "unknown";
  return createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

function memCheck(key: string, limit: number, windowMs: number): { ok: boolean; retryAfterSec?: number } {
  const now = Date.now();
  const hits = (memBuckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    const oldest = hits[0] ?? now;
    return { ok: false, retryAfterSec: Math.ceil((windowMs - (now - oldest)) / 1000) };
  }
  hits.push(now);
  if (memBuckets.size > 5000) {
    for (const [k, v] of memBuckets) {
      if (v.every((t) => now - t >= windowMs)) memBuckets.delete(k);
      if (memBuckets.size <= 4000) break;
    }
  }
  memBuckets.set(key, hits);
  return { ok: true };
}

async function dbCheck(ipHash: string, tag: string, limit: number, windowMs: number): Promise<{ ok: boolean; retryAfterSec?: number } | null> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
    const sb = getSupabaseAdmin();
    const since = new Date(Date.now() - windowMs).toISOString();
    // Prune this bucket's expired rows (bounds table growth per active key)
    await sb.from("rate_hits").delete().eq("ip_hash", ipHash).eq("tag", tag).lt("created_at", since);
    const { data, error } = await sb.from("rate_hits").select("created_at").eq("ip_hash", ipHash).eq("tag", tag).gte("created_at", since).order("created_at").limit(limit + 1);
    if (error) return null; // missing table pre-migration → memory fallback
    const rows = (data ?? []) as { created_at: string }[];
    if (rows.length >= limit) {
      const oldest = new Date(rows[0]!.created_at).getTime();
      return { ok: false, retryAfterSec: Math.max(1, Math.ceil((windowMs - (Date.now() - oldest)) / 1000)) };
    }
    const { error: insErr } = await sb.from("rate_hits").insert({ ip_hash: ipHash, tag });
    if (insErr) return null;
    return { ok: true };
  } catch {
    return null;
  }
}

export async function rateLimit(
  req: Request,
  tag: string,
  limit: number,
  windowMs: number,
): Promise<{ ok: boolean; retryAfterSec?: number }> {
  const ipHash = clientIpHash(req);
  const db = await dbCheck(ipHash, tag, limit, windowMs);
  if (db) return db;
  return memCheck(`${tag}:${ipHash}`, limit, windowMs);
}

// Presets per endpoint (conservative for fraud-prone writes)
export const LIMITS = {
  submit: { limit: 5, windowMs: 60 * 60 * 1000 }, // 5 submissions / hour / IP
  vote: { limit: 20, windowMs: 60 * 60 * 1000 }, // 20 votes / hour / IP
  verify: { limit: 30, windowMs: 60 * 60 * 1000 },
  serial: { limit: 5, windowMs: 60 * 60 * 1000 },
  review: { limit: 5, windowMs: 60 * 60 * 1000 },
  claim: { limit: 3, windowMs: 24 * 60 * 60 * 1000 },
  track: { limit: 300, windowMs: 60 * 60 * 1000 },
} as const;
