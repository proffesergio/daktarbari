import { createClient } from "@supabase/supabase-js";

// Server-side admin client (service role) — NEVER expose to browser
export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !key) throw new Error("Missing Supabase server env");
  return createClient(url, key);
}

// Public read client (anon key, RLS: read APPROVED only)
export function getSupabasePublic() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  if (!url || !key) throw new Error("Missing Supabase public env");
  return createClient(url, key);
}
