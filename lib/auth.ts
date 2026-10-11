import { createHash } from "crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "admin_auth";

export function hashAdminToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

async function cookieToken(): Promise<string> {
  const store = await cookies();
  return store.get(ADMIN_COOKIE)?.value ?? "";
}

export function isValidAdminToken(token: string): boolean {
  return !!process.env.ADMIN_TOKEN && token === process.env.ADMIN_TOKEN;
}

// Named admins (admins table, token_hash) + legacy master ADMIN_TOKEN.
// Cookie holds the raw token either way; the hash never leaves the server.
export async function getAdminActor(): Promise<string | null> {
  const token = await cookieToken();
  if (!token) return null;
  if (isValidAdminToken(token)) return "master";
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
    const { getSupabaseAdmin } = await import("@/lib/supabase");
    const sb = getSupabaseAdmin();
    const { data } = await sb
      .from("admins")
      .select("name,active")
      .eq("token_hash", hashAdminToken(token))
      .maybeSingle();
    if (data && (data.active as boolean)) return data.name as string;
    return null;
  } catch {
    return null;
  }
}

export async function isAdminAuthenticated(): Promise<boolean> {
  return (await getAdminActor()) !== null;
}
