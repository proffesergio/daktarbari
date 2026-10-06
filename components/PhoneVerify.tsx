"use client";

import { useEffect, useState } from "react";
import { BadgeCheck, PhoneCall } from "lucide-react";

// Community check: anyone confirms the listed number or submits the right one.
// Works for DB rows and seed/qimp ids alike.
export default function PhoneVerify({ doctorId, currentPhone }: { doctorId: string; currentPhone: string }) {
  const [counts, setCounts] = useState<{ confirms: number; corrections: number; suggested: string | null } | null>(null);
  const [fix, setFix] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const hasPhone = !!currentPhone && !currentPhone.includes("যাচাই");

  useEffect(() => {
    let live = true;
    fetch(`/api/verify-phone?doctor_id=${encodeURIComponent(doctorId)}`)
      .then((r) => r.json())
      .then((j) => { if (live) setCounts(j); })
      .catch(() => { /* offline-safe: hide counts */ });
    return () => { live = false; };
  }, [doctorId]);

  async function refresh() {
    try {
      const r = await fetch(`/api/verify-phone?doctor_id=${encodeURIComponent(doctorId)}`);
      setCounts(await r.json());
    } catch {
      /* ignore */
    }
  }

  async function send(action: "confirm" | "correct") {
    if (busy) return;
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/verify-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctor_id: doctorId, action, phone: fix }),
      });
      const j = await res.json();
      if (res.ok) {
        setMsg(action === "confirm" ? "✅ ধন্যবাদ! নিশ্চিত করা হয়েছে।" : "✅ সঠিক নম্বর পাঠানো হয়েছে, অ্যাডমিন আপডেট করবেন।");
        setFix("");
        refresh();
      } else setMsg(`❌ ${j.error ?? "ব্যর্থ"}`);
    } catch {
      setMsg("❌ নেটওয়ার্ক সমস্যা।");
    }
    setBusy(false);
  }

  return (
    <div className="mt-5 rounded-2xl border-2 border-emerald-200 bg-emerald-50/50 p-4">
      <p className="flex items-center gap-2 text-xl font-bold">
        <BadgeCheck size={22} className="text-emerald-700" /> নম্বরটি কি সঠিক?
      </p>
      {counts && (counts.confirms > 0 || counts.corrections > 0) && (
        <p className="mt-1 text-lg text-gray-700">
          ✓ {counts.confirms} জন নিশ্চিত করেছে{counts.corrections > 0 && ` • ${counts.corrections}টি সংশোধনী এসেছে`}
          {counts.suggested && <> • প্রস্তাবিত: <a className="font-bold text-emerald-800" href={`tel:${counts.suggested}`}>{counts.suggested}</a></>}
        </p>
      )}
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        {hasPhone && (
          <button onClick={() => send("confirm")} disabled={busy} className="touch-target flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 text-xl font-bold text-white disabled:bg-gray-400">
            <PhoneCall size={22} /> হ্যাঁ, নম্বর সঠিক
          </button>
        )}
        <div className="flex flex-1 gap-2">
          <input value={fix} onChange={(e) => setFix(e.target.value)} inputMode="tel" placeholder="সঠিক নম্বর লিখুন" className="min-w-0 flex-1 rounded-xl border-2 border-gray-300 px-4 py-2 text-xl" />
          <button onClick={() => send("correct")} disabled={busy || !fix} className="touch-target rounded-xl border-2 border-emerald-700 px-4 text-xl font-bold text-emerald-800 disabled:opacity-50">
            পাঠান
          </button>
        </div>
      </div>
      {msg && <p className="mt-2 text-lg font-bold">{msg}</p>}
    </div>
  );
}
