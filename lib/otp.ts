import { createHash, randomInt, timingSafeEqual } from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase";
import { queueNotification } from "@/lib/notify";

const CODE_TTL_MIN = 10;
const MAX_ATTEMPTS = 5;

function hash(phone: string, code: string): string {
  return createHash("sha256").update(`${phone}:${code}`).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a, "hex");
    const bb = Buffer.from(b, "hex");
    return ba.length === bb.length && timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

// Issue an OTP to a phone (rate-limited per phone + caller throttles in route).
// Delivery via SMS provider when configured; otherwise the code stays in the
// admin notifications queue (testing/manual fallback).
export async function requestOtp(phone: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const sb = getSupabaseAdmin();
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count } = await sb.from("otp_requests").select("id", { count: "exact", head: true }).eq("phone", phone).gte("created_at", since);
    if ((count ?? 0) >= 3) return { ok: false, error: "আজকের সীমা শেষ — কাল আবার চেষ্টা করুন" };
    const code = String(randomInt(100000, 999999));
    const { error } = await sb.from("otp_requests").insert({
      phone,
      code_hash: hash(phone, code),
      expires_at: new Date(Date.now() + CODE_TTL_MIN * 60 * 1000).toISOString(),
    });
    if (error) return { ok: false, error: "পাঠানো যায়নি" };
    await queueNotification("sms", phone, `ডাক্তারবাড়ি যাচাই কোড: ${code} (১০ মিনিট)। কাউকে দেবেন না।`);
    return { ok: true };
  } catch {
    return { ok: false, error: "পাঠানো যায়নি" };
  }
}

export async function verifyOtp(phone: string, code: string): Promise<boolean> {
  try {
    const sb = getSupabaseAdmin();
    const { data } = await sb
      .from("otp_requests")
      .select("id,code_hash,attempts,consumed,expires_at")
      .eq("phone", phone)
      .eq("consumed", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!data) return false;
    if (new Date(data.expires_at as string).getTime() < Date.now()) return false;
    if ((data.attempts as number) >= MAX_ATTEMPTS) return false;
    const good = safeEqual(hash(phone, code.replace(/\D/g, "")), data.code_hash as string);
    await sb.from("otp_requests").update({
      attempts: (data.attempts as number) + 1,
      consumed: good,
    }).eq("id", data.id);
    return good;
  } catch {
    return false;
  }
}
