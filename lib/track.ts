"use client";

// Fire-and-forget user-activity beacon (profile views, call/WhatsApp taps).
// Batched via sendBeacon when available; failures are silent by design.
export function track(kind: string, doctor_id?: string, meta?: string, query?: string) {
  try {
    const body = JSON.stringify({ kind, doctor_id: doctor_id ?? null, meta: meta ?? "", query: query ?? "" });
    if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
      const blob = new Blob([body], { type: "application/json" });
      if (navigator.sendBeacon("/api/track", blob)) return;
    }
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* never break UX for analytics */
  }
}
