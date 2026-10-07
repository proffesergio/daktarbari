"use client";

import { useEffect, useState } from "react";
import { BadgeCheck, ShieldCheck } from "lucide-react";
import type { VerifyTarget } from "@/lib/types";

const TARGETS: { value: VerifyTarget; label: string }[] = [
  { value: "phone", label: "ফোন" },
  { value: "chamber", label: "চেম্বার" },
  { value: "fee", label: "ফি" },
  { value: "hours", label: "সময়" },
  { value: "bmdc", label: "BMDC" },
  { value: "general", label: "অন্যান্য" },
];

type Counts = Record<string, { confirms: number; corrections: number; suggested: string | null }>;

// Universal verify: users / doctors / admin can confirm or correct
// any field. Compact collapsible panel.
export default function VerifyPanel({ doctorId }: { doctorId: string }) {
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<VerifyTarget>("phone");
  const [note, setNote] = useState("");
  const [counts, setCounts] = useState<Counts>({});
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let live = true;
    fetch(`/api/verify?doctor_id=${encodeURIComponent(doctorId)}`)
      .then((r) => r.json())
      .then((j) => {
        if (live && j.targets) setCounts(j.targets);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [doctorId]);

  async function refresh() {
    try {
      const r = await fetch(`/api/verify?doctor_id=${encodeURIComponent(doctorId)}`);
      const j = await r.json();
      if (j.targets) setCounts(j.targets);
    } catch {
      /* ignore */
    }
  }

  async function send(action: "confirm" | "correct") {
    if (busy) return;
    if (action === "correct" && !note.trim()) {
      setMsg("❌ সঠিক তথ্য লিখুন");
      return;
    }
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctor_id: doctorId, target, action, note }),
      });
      const j = await res.json();
      if (res.ok) {
        setMsg(action === "confirm" ? "✅ ধন্যবাদ! নিশ্চিত হয়েছে।" : "✅ সংশোধনী পাঠানো হয়েছে।");
        setNote("");
        refresh();
      } else setMsg(`❌ ${j.error ?? "ব্যর্থ"}`);
    } catch {
      setMsg("❌ নেটওয়ার্ক সমস্যা।");
    }
    setBusy(false);
  }

  const totalConfirms = Object.values(counts).reduce((a, c) => a + c.confirms, 0);
  const totalCorrections = Object.values(counts).reduce((a, c) => a + c.corrections, 0);

  return (
    <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50/60 p-3">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="flex items-center gap-1.5 text-sm font-bold text-emerald-900">
          <ShieldCheck size={16} className="text-emerald-700" />
          তথ্য যাচাই করুন
          {totalConfirms > 0 && (
            <span className="rounded-full bg-emerald-700 px-2 py-0.5 text-[11px] text-white">
              ✓ {totalConfirms}
            </span>
          )}
        </span>
        <span className="text-xs font-bold text-emerald-700">{open ? "▲" : "▼"}</span>
      </button>

      {(totalConfirms > 0 || totalCorrections > 0) && (
        <p className="mt-1 text-xs text-gray-600">
          ✓ {totalConfirms} নিশ্চিত{totalCorrections > 0 && ` • ${totalCorrections} সংশোধনী`}
        </p>
      )}

      {open && (
        <div className="animate-fade-up mt-2">
          <div className="flex flex-wrap gap-1">
            {TARGETS.map((t) => (
              <button
                key={t.value}
                onClick={() => setTarget(t.value)}
                className={`rounded-full border px-2.5 py-1 text-xs font-bold ${
                  target === t.value
                    ? "border-emerald-700 bg-emerald-700 text-white"
                    : "border-gray-200 bg-white text-gray-700"
                }`}
              >
                {t.label}
                {counts[t.value] && counts[t.value].confirms > 0 && ` ✓${counts[t.value].confirms}`}
              </button>
            ))}
          </div>
          {counts[target]?.suggested && (
            <p className="mt-1.5 text-xs text-gray-700">
              প্রস্তাবিত: <span className="font-bold text-emerald-800">{counts[target].suggested}</span>
            </p>
          )}
          <div className="mt-2 flex gap-1.5">
            <button
              onClick={() => send("confirm")}
              disabled={busy}
              className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white disabled:bg-gray-400"
            >
              <BadgeCheck size={14} /> সঠিক
            </button>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={target === "phone" ? "সঠিক নম্বর (01XXXXXXXXX)" : "সঠিক তথ্য লিখুন"}
              className="min-w-0 flex-[2] rounded-lg border border-gray-300 px-2.5 py-2 text-xs"
            />
            <button
              onClick={() => send("correct")}
              disabled={busy || !note.trim()}
              className="rounded-lg border border-emerald-700 px-3 py-2 text-xs font-bold text-emerald-800 disabled:opacity-50"
            >
              পাঠান
            </button>
          </div>
          {msg && <p className="mt-1.5 text-xs font-bold">{msg}</p>}
        </div>
      )}
    </div>
  );
}
