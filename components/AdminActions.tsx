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
    <div className="mt-4 rounded-2xl border-2 border-dashed p-4">
      <p className="text-xl font-bold">📥 Sheet ↔ DB</p>
      <p className="text-lg text-gray-600">প্রথমে Seed তুলুন (একবার), এরপর Sheet এডিট করে Sync চাপুন — ওয়েবসাইট আপডেট হবে।</p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <button onClick={() => run("/api/admin/seed", "Seed")} disabled={!!busy} className="touch-target rounded-xl bg-emerald-700 px-5 text-xl font-bold text-white disabled:bg-gray-400">
          {busy === "Seed" ? "..." : "① সব Seed তুলুন (~১৩০০+)"}
        </button>
        <button onClick={() => run("/api/admin/sync", "Sync")} disabled={!!busy} className="touch-target rounded-xl border-2 border-emerald-700 px-5 text-xl font-bold text-emerald-800 disabled:opacity-50">
          {busy === "Sync" ? "..." : "② Sheet থেকে Sync"}
        </button>
      </div>
      {msg && <p className="mt-2 text-lg font-bold">{msg}</p>}
    </div>
  );
}
