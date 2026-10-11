"use client";

import { useEffect, useState } from "react";

// Named admins: per-person login tokens so the audit trail shows who did what.
// Tokens are shown ONCE at creation (only the hash is stored).
export default function AdminAdmins() {
  const [list, setList] = useState<{ id: string; name: string; active: boolean }[]>([]);
  const [you, setYou] = useState("");
  const [name, setName] = useState("");
  const [fresh, setFresh] = useState<{ name: string; token: string } | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [missing, setMissing] = useState(false);

  async function load() {
    try {
      const r = await fetch("/api/admin/admins", { cache: "no-store" });
      const j = await r.json();
      if (j.admins) setList(j.admins);
      if (j.you) setYou(j.you);
      if (j.missing_table) setMissing(true);
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    let alive = true;
    (async () => {
      if (alive) await load();
    })();
    return () => {
      alive = false;
    };
  }, []);

  async function add() {
    if (name.trim().length < 2) return setMsg("❌ নাম দিন");
    setBusy(true);
    setMsg("");
    setFresh(null);
    try {
      const res = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok) {
        setFresh({ name: j.name, token: j.token });
        setName("");
        load();
      } else setMsg(`❌ ${j.error ?? "ব্যর্থ"}`);
    } catch {
      setMsg("❌ নেটওয়ার্ক সমস্যা");
    }
    setBusy(false);
  }

  async function toggle(id: string, active: boolean) {
    setBusy(true);
    try {
      await fetch("/api/admin/admins", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, active }),
      });
      load();
    } catch {
      /* ignore */
    }
    setBusy(false);
  }

  return (
    <div className="mt-3 rounded-xl border border-gray-200 p-3">
      <p className="text-sm font-bold">👥 অ্যাডমিন অ্যাকাউন্ট {you && <span className="text-gray-500">(আপনি: {you})</span>}</p>
      {missing && <p className="mt-1 text-xs text-amber-700">admins টেবিল নেই — phase-3 migration চালান।</p>}
      {!missing && (
        <>
          <ul className="mt-2 flex flex-col gap-1">
            {list.map((a) => (
              <li key={a.id} className="flex items-center gap-2 rounded-lg bg-gray-50 px-2.5 py-1.5 text-xs">
                <b>{a.name}</b>
                <span className={a.active ? "text-emerald-700" : "text-gray-400"}>{a.active ? "● সক্রিয়" : "○ বন্ধ"}</span>
                <button disabled={busy} onClick={() => toggle(a.id, !a.active)} className="ml-auto rounded-lg border border-gray-200 px-2 py-1 font-bold text-gray-600">
                  {a.active ? "বন্ধ করুন" : "চালু করুন"}
                </button>
              </li>
            ))}
            {list.length === 0 && <p className="text-xs text-gray-500">শুধু মাস্টার টোকেন চলছে।</p>}
          </ul>
          <div className="mt-2 flex gap-1.5">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="নতুন অ্যাডমিনের নাম" className="min-w-0 flex-1 rounded-lg border border-gray-200 px-2.5 py-2 text-xs outline-none focus:border-emerald-600" />
            <button disabled={busy} onClick={add} className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">+ টোকেন বানান</button>
          </div>
          {fresh && (
            <p className="mt-2 break-all rounded-lg bg-emerald-50 px-2.5 py-2 text-xs">
              ✅ <b>{fresh.name}</b>-এর টোকেন (একবারই দেখা যাবে — কপি করে তাকে দিন): <b>{fresh.token}</b>
            </p>
          )}
          {msg && <p className="mt-1 text-xs font-bold">{msg}</p>}
        </>
      )}
    </div>
  );
}
