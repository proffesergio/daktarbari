import { getSupabaseAdmin } from "@/lib/supabase";

// Outbound notifications (SMS/WhatsApp), provider-pluggable.
// Configure a generic HTTP SMS gateway via env:
//   SMS_API_URL=https://gateway.example.com/send
//   SMS_API_KEY=...
//   (POST { to, message } with Bearer key; expects 2xx)
// WhatsApp Cloud API via:
//   WHATSAPP_API_URL=https://graph.facebook.com/v21.0/<PHONE_ID>/messages
//   WHATSAPP_API_KEY=<token>
// Without env, messages stay QUEUED (visible in admin) — never blocks UX.

export async function queueNotification(
  channel: "sms" | "whatsapp" | "note",
  to_phone: string,
  body: string,
): Promise<void> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return;
    const sb = getSupabaseAdmin();
    const { data } = await sb.from("notifications").insert({ channel, to_phone, body }).select("id").maybeSingle();
    if (data) void trySendNotification(data.id as string);
  } catch {
    /* best-effort */
  }
}

export async function trySendNotification(id: string): Promise<boolean> {
  try {
    const sb = getSupabaseAdmin();
    const { data: n } = await sb.from("notifications").select("*").eq("id", id).maybeSingle();
    if (!n || n.status === "SENT") return true;
    const channel = n.channel as string;
    const url = channel === "sms" ? process.env.SMS_API_URL : channel === "whatsapp" ? process.env.WHATSAPP_API_URL : null;
    const key = channel === "sms" ? process.env.SMS_API_KEY : channel === "whatsapp" ? process.env.WHATSAPP_API_KEY : null;
    if (!url || !key) {
      await sb.from("notifications").update({ status: "QUEUED", error: "provider not configured" }).eq("id", id);
      return false;
    }
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify(
        channel === "whatsapp" && process.env.WHATSAPP_API_URL?.includes("facebook.com")
          ? { messaging_product: "whatsapp", to: n.to_phone, type: "text", text: { body: n.body } }
          : { to: n.to_phone, message: n.body },
      ),
    });
    if (res.ok) {
      await sb.from("notifications").update({ status: "SENT", error: "" }).eq("id", id);
      return true;
    }
    await sb.from("notifications").update({ status: "FAILED", error: `HTTP ${res.status}` }).eq("id", id);
    return false;
  } catch (e) {
    try {
      const sb = getSupabaseAdmin();
      await sb.from("notifications").update({ status: "FAILED", error: e instanceof Error ? e.message.slice(0, 200) : "send failed" }).eq("id", id);
    } catch {
      /* ignore */
    }
    return false;
  }
}
