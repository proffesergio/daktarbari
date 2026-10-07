"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Sheet-first controls: push local seeds once, then pull Sheet → DB anytime.
export default function AdminActions() {
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState("");
  const router = useRouter();

  async function run(path: string, label: string) {
    setBusy(label);
    setMsg("");
    try {
      const res = await fetch(path, { method: "POST" });
      const j = await res.json();
      setMsg(res.ok ? `✅ ${label}: DB ${j.synced}/${j.total} • Sheet +${j.sheetAdded ?? 0}` : `❌ ${j.error ?? "ব্যর্থ"}`);
      if (res.ok) router.refresh();
    } catch {
      setMsg("❌ নেটওয়ার্ক সমস্যা।");
    }
    setBusy("");
  }

  return (
    <div className="mt-2.5 rounded-xl border border-dashed border-gray-300 p-3">
      <p className="text-sm font-bold">📥 Sheet ↔ DB সিংক</p>
      <p className="mt-0.5 text-xs text-gray-500">প্রথমে Seed তুলুন (একবার), এরপর Sheet এডিট করে Sync চাপুন — ওয়েবসাইট আপডেট হবে।</p>
      <div className="mt-2.5 flex flex-col gap-1.5 sm:flex-row">
        <button onClick={() => run("/api/admin/seed", "Seed")} disabled={!!busy} className="rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white disabled:bg-gray-400">
          {busy === "Seed" ? "…" : "① সব Seed তুলুন"}
        </button>
        <button onClick={() => run("/api/admin/sync", "Sync")} disabled={!!busy} className="rounded-xl border border-emerald-700 px-4 py-2.5 text-sm font-bold text-emerald-800 disabled:opacity-50">
          {busy === "Sync" ? "…" : "② Sheet থেকে Sync"}
        </button>
      </div>
      {msg && <p className="mt-2 text-xs font-bold">{msg}</p>}
    </div>
  );
}
