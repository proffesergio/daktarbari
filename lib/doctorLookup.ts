import { getSupabasePublic, getSupabaseAdmin } from "@/lib/supabase";
import { findSeed } from "@/lib/seed-doctors";
import { findQimp } from "@/lib/seed-qimp14";
import { findBdd } from "@/lib/seed-bddoctor";
import { findBancharampur } from "@/lib/seed-bancharampur";
import type { Doctor } from "@/lib/types";

// Shared doctor lookup: service-role row (any status for seeds, APPROVED
// for real ids) → local seeds → public APPROVED row.
export async function getDoctorById(id: string): Promise<Doctor | null> {
  const external = id.startsWith("seed-") || id.startsWith("qimp-");
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const sb = getSupabaseAdmin();
      const q = sb.from("doctors").select("*").eq("id", id);
      const { data } = external ? await q.maybeSingle() : await q.eq("status", "APPROVED").maybeSingle();
      if (data) return data as Doctor;
    } catch {
      /* fall through to local */
    }
  }
  if (id.startsWith("seed-")) return findSeed(id) ?? null;
  if (id.startsWith("qimp-")) return findQimp(id) ?? null;
  if (id.startsWith("bd-")) return findBdd(id) ?? null;
  if (id.startsWith("bnc-")) return findBancharampur(id) ?? null;
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  try {
    const sb = getSupabasePublic();
    const { data } = await sb.from("doctors").select("*").eq("id", id).eq("status", "APPROVED").single();
    return data as Doctor | null;
  } catch {
    return null;
  }
}

export function isExternalId(id: string): boolean {
  return id.startsWith("seed-") || id.startsWith("qimp-") || id.startsWith("bd-") || id.startsWith("bnc-");
}
