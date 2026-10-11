import { getSupabaseAdmin } from "@/lib/supabase";

// Best-effort admin audit trail. Never throws (missing table pre-migration
// must not break admin actions). Actor resolves from the admin cookie.
export async function logAdmin(action: string, doctor_id?: string | null, detail?: string, actor?: string) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return;
    let who = actor;
    if (!who) {
      try {
        const { getAdminActor } = await import("@/lib/auth");
        who = (await getAdminActor()) ?? "unknown";
      } catch {
        who = "unknown";
      }
    }
    const sb = getSupabaseAdmin();
    const row: Record<string, unknown> = {
      action,
      doctor_id: doctor_id ?? null,
      detail: (detail ?? "").slice(0, 500),
    };
    // actor column needs the phase-3 migration; retry without it if missing.
    try {
      const { error } = await sb.from("admin_actions").insert({ ...row, actor: who });
      if (error && /column|actor/i.test(error.message)) {
        await sb.from("admin_actions").insert(row);
      }
    } catch {
      await sb.from("admin_actions").insert(row);
    }
  } catch {
    /* audit is observability, never a blocker */
  }
}

export async function logSync(direction: string, total: number, ok_count: number, error?: string) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return;
    const sb = getSupabaseAdmin();
    await sb.from("sync_logs").insert({
      direction,
      total,
      ok_count,
      error: (error ?? "").slice(0, 500),
    });
  } catch {
    /* ignore */
  }
}
