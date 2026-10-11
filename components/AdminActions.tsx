"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Health = {
  env: boolean;
  auth: boolean;
  tabs: { pending: boolean; approved: boolean; reports: boolean };
  headersOk: boolean;
  error: string;
};

type Hist = { direction: string; total: number; ok_count: number; error: string; created_at: string };

// DB-WINS controls: Sheet is a mirror + bulk-import source.
// Seed pushes locals once; Sync imports only NEW Sheet rows (never overwrites).
export default function AdminActions() {
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState("");
  const [health, setHealth] = useState<Health | null>(null);
  const [history, setHistory] = useState<Hist[]>([]);
  const [importMsg, setImportMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    let alive = true;
    fetch("/api/admin/sheet-health", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        if (!alive) return;
        if (j.health) setHealth(j.health);
        if (j.history) setHistory(j.history);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  async function run(path: string, label: string) {
    setBusy(label);
    setMsg("");
    try {
      const res = await fetch(path, { method: "POST" });
      const j = await res.json();
      setMsg(
        res.ok
          ? `✅ ${label}: নতুন ${j.synced ?? 0}/${j.total ?? 0}${j.skipped ? ` • আগে ছিল ${j.skipped} (অপরিবর্তিত)` : ""}${j.sheetAdded ? ` • Sheet +${j.sheetAdded}` : ""}`
          : `❌ ${j.error ?? "ব্যর্থ"}`,
      );
      if (res.ok) router.refresh();
    } catch {
      setMsg("❌ নেটওয়ার্ক সমস্যা।");
    }
    setBusy("");
  }

  const dot = (ok: boolean) => (ok ? "🟢" : "🔴");

  async function uploadCsv(file: File) {
    setBusy("Import");
    setImportMsg("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/import", { method: "POST", body: fd });
      const j = await res.json().catch(() => ({}));
      if (res.ok) {
        setImportMsg(`✅ ${j.imported}/${j.total}টি লাইভ${j.errors?.length ? ` • ${j.errors.length} সারি ভুল (প্রথম: সারি ${j.errors[0].row} — ${j.errors[0].error})` : ""}`);
        router.refresh();
      } else setImportMsg(`❌ ${j.error ?? "ব্যর্থ"}${j.imported ? ` • তবু ${j.imported}টি ঢুকেছে` : ""}`);
    } catch {
      setImportMsg("❌ নেটওয়ার্ক সমস্যা");
    }
    setBusy("");
  }

  return (
    <div className="flex flex-col gap-2.5">
      <div className="rounded-xl border border-gray-200 p-3">
        <p className="text-sm font-bold">🩺 Sheet স্বাস্থ্য</p>
        {!health ? (
          <p className="mt-1 text-xs text-gray-500">পরীক্ষা চলছে…</p>
        ) : (
          <div className="mt-1 text-xs">
            <p>{dot(health.env)} Env (ID/Email/Key) • {dot(health.auth)} সংযোগ • {dot(health.tabs.pending)} Pending • {dot(health.tabs.approved)} Approved • {dot(health.headersOk)} হেডার</p>
            {health.error && <p className="mt-1 font-semibold text-amber-700">⚠ {health.error}</p>}
            {!health.error && <p className="mt-1 font-semibold text-emerald-700">✅ Sheet ঠিক আছে — Approve/Reject/Delete স্বয়ংক্রিয়ভাবে মিরর হবে।</p>}
          </div>
        )}
      </div>
      <div className="rounded-xl border border-dashed border-gray-300 p-3">
        <p className="text-sm font-bold">📥 Sheet ↔ DB (DB জিতবে)</p>
        <p className="mt-0.5 text-xs text-gray-500">প্রথমে Seed তুলুন (একবার), এরপর Sheet-এ নতুন সারি যোগ করে Sync চাপুন — শুধু <b>নতুন</b> সারি আসবে, পুরনো সিদ্ধান্ত বদলাবে না।</p>
        <div className="mt-2.5 flex flex-col gap-1.5 sm:flex-row">
          <button onClick={() => run("/api/admin/seed", "Seed")} disabled={!!busy} className="rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white disabled:bg-gray-400">
            {busy === "Seed" ? "…" : "① সব Seed তুলুন"}
          </button>
          <button onClick={() => run("/api/admin/sync", "Sync")} disabled={!!busy} className="rounded-xl border border-emerald-700 px-4 py-2.5 text-sm font-bold text-emerald-800 disabled:opacity-50">
            {busy === "Sync" ? "…" : "② নতুন সারি আনুন"}
          </button>
        </div>
        {msg && <p className="mt-2 text-xs font-bold">{msg}</p>}
      </div>
      <div className="rounded-xl border border-gray-200 p-3">
        <p className="text-sm font-bold">📤 বাল্ক CSV ইমপোর্ট (নতুন তথ্য ⏳ ব্যাজসহ লাইভ হবে)</p>        <p className="mt-0.5 text-xs text-gray-500">টেমপ্লেটে সর্বোচ্চ ২০০ সারি — ভুল সারি বাদ যাবে, পুরনো তথ্য কখনো বদলাবে না।</p>
        <div className="mt-2 flex flex-col gap-1.5 sm:flex-row">
          <a href="/api/admin/import" className="rounded-xl border border-gray-200 px-4 py-2.5 text-center text-sm font-bold text-gray-700">
            ⬇ টেমপ্লেট নিন
          </a>
          <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) uploadCsv(f);
            e.target.value = "";
          }} />
          <button onClick={() => fileRef.current?.click()} disabled={!!busy} className="rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white disabled:bg-gray-400">
            {busy === "Import" ? "…" : "⬆ CSV আপলোড"}
          </button>
        </div>
        {importMsg && <p className="mt-2 text-xs font-bold">{importMsg}</p>}
      </div>
      <div className="rounded-xl border border-gray-200 p-3">
        <p className="text-sm font-bold">📥 CSV এক্সপোর্ট (অফলাইন কাজের জন্য)</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {(["doctors", "serials", "reviews"] as const).map((t) => (
            <a key={t} href={`/api/admin/export?table=${t}`} className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-bold text-gray-700 hover:border-emerald-600">
              ⬇ {t}
            </a>
          ))}
        </div>
      </div>
      {history.length > 0 && (
        <div className="rounded-xl border border-gray-200 p-3">
          <p className="text-sm font-bold">🕒 সিংক ইতিহাস</p>
          <ul className="mt-1.5 flex flex-col gap-1 text-xs">
            {history.slice(0, 5).map((h, i) => (
              <li key={i} className="rounded-lg bg-gray-50 px-2.5 py-1.5">
                {h.direction} • ✅{h.ok_count}/{h.total}
                {h.error && <span className="text-red-600"> • {h.error}</span>}{" "}
                <span className="text-gray-400">{new Date(h.created_at).toLocaleString("bn-BD")}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
