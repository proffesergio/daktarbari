"use client";

import { useEffect, useState } from "react";
import { Star, ThumbsUp } from "lucide-react";
import { track } from "@/lib/track";

export type Review = { id: string; rating: number; comment: string; patient_name: string; created_at: string };

// Moderated reviews: form submits to PENDING, list shows APPROVED only.
export default function ReviewSection({ doctorId, initial }: { doctorId: string; initial: Review[] }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [name, setName] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [helpful, setHelpful] = useState<Record<string, number>>({});

  useEffect(() => {
    let alive = true;
    fetch(`/api/reviews/vote?doctor_id=${encodeURIComponent(doctorId)}`)
      .then((r) => r.json())
      .then((j) => {
        if (alive && j.counts) setHelpful(j.counts);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [doctorId]);

  async function voteHelpful(id: string) {
    try {
      const res = await fetch("/api/reviews/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ review_id: id }),
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok) {
        setHelpful((h) => ({ ...h, [id]: Math.max(0, (h[id] ?? 0) + (j.voted ? 1 : -1)) }));
      }
    } catch {
      /* ignore */
    }
  }

  const avg = initial.length ? (initial.reduce((s, r) => s + r.rating, 0) / initial.length).toFixed(1) : null;

  async function submit() {
    if (busy) return;
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctor_id: doctorId, rating, comment, patient_name: name }),
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok) {
        setMsg("✅ ধন্যবাদ! যাচাই শেষে রিভিউ দেখা যাবে।");
        track("review_submit", doctorId, String(rating));
        setComment("");
      } else setMsg(`❌ ${j.error ?? "ব্যর্থ"}`);
    } catch {
      setMsg("❌ নেটওয়ার্ক সমস্যা");
    }
    setBusy(false);
  }

  return (
    <div className="mt-3 rounded-2xl border border-gray-100 bg-white p-3">
      <h2 className="text-sm font-bold">
        ⭐ রোগীদের রিভিউ{" "}
        {avg && <span className="text-emerald-700">({avg}/৫ • {initial.length}টি)</span>}
      </h2>
      {initial.length > 0 ? (
        <ul className="mt-2 flex flex-col gap-1.5">
          {initial.slice(0, 5).map((r) => (
            <li key={r.id} className="rounded-xl bg-gray-50 px-3 py-2 text-[13px]">
              <span className="font-bold text-amber-600">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>{" "}
              <span className="text-gray-700">{r.comment || "—"}</span>
              {r.patient_name && <span className="block text-[11px] text-gray-500">— {r.patient_name}</span>}
              <button onClick={() => voteHelpful(r.id)} className="mt-1 inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2 py-0.5 text-[11px] font-bold text-gray-600 hover:border-emerald-600 hover:text-emerald-700">
                <ThumbsUp size={11} /> সহায়ক{helpful[r.id] ? ` (${helpful[r.id]})` : ""}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1.5 text-xs text-gray-500">এখনো রিভিউ নেই — প্রথম রিভিউ দিন।</p>
      )}
      <div className="mt-2.5 rounded-xl border border-dashed border-gray-200 p-2.5">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <button key={s} onClick={() => setRating(s)} aria-label={`${s} তারা`} className={s <= rating ? "text-amber-500" : "text-gray-300"}>
              <Star size={22} fill="currentColor" strokeWidth={0} />
            </button>
          ))}
          <span className="ml-1 text-xs font-bold text-gray-600">{rating}/৫</span>
        </div>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="আপনার নাম (ঐচ্ছিক)" className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-xs outline-none focus:border-emerald-600" />
        <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="চিকিৎসা কেমন ছিল? (ঐচ্ছিক)" rows={2} className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2 text-xs outline-none focus:border-emerald-600" />
        <button onClick={submit} disabled={busy} className="mt-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white disabled:bg-gray-400">
          {busy ? "…" : "রিভিউ পাঠান"}
        </button>
        {msg && <p className="mt-1 text-xs font-bold">{msg}</p>}
      </div>
    </div>
  );
}
