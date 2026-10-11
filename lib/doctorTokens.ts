import { randomBytes } from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase";

// Doctor-scoped tokens for the self-edit portal and chamber inbox.
// Tokens are random 32-char strings, expiry-bound, revocable.
export async function issueDoctorToken(
  doctor_id: string,
  scope: "edit" | "inbox",
  daysValid = 90,
): Promise<string | null> {
  try {
    const token = randomBytes(24).toString("base64url");
    const sb = getSupabaseAdmin();
    const { error } = await sb.from("doctor_tokens").insert({
      token,
      doctor_id,
      scope,
      expires_at: new Date(Date.now() + daysValid * 24 * 60 * 60 * 1000).toISOString(),
    });
    if (error) return null;
    return token;
  } catch {
    return null;
  }
}

export async function resolveDoctorToken(
  token: string,
  scope: "edit" | "inbox",
): Promise<string | null> {
  try {
    const sb = getSupabaseAdmin();
    const { data } = await sb
      .from("doctor_tokens")
      .select("doctor_id,expires_at,revoked")
      .eq("token", token)
      .eq("scope", scope)
      .maybeSingle();
    if (!data || data.revoked) return null;
    if (new Date(data.expires_at).getTime() < Date.now()) return null;
    return data.doctor_id as string;
  } catch {
    return null;
  }
}
