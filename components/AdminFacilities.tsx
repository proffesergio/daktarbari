"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DIVISIONS } from "@/lib/divisions";

type F = {
  id: string;
  kind: string;
  name_bn: string;
  division_bn: string;
  district_bn: string;
  phone: string;
};

// Admin: manually add hospitals/diagnostics for future growth.
// Lists DB rows (seed list lives in lib/facilities.ts for public pages).
export default function AdminFacilities() {
  const [list, setList] = useState<F[]>([]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [kind, setKind] = useState("hospital");
  const [division, setDivision] = useState(DIVISIONS[0].name_bn);
  const router = useRouter();

  const districts = DIVISIONS.find((d) => d.name_bn === division)?.districts ?? [];

  async function load() {
    try {
      const r = await fetch("/api/admin/facilities");
      const j = await r.json();
      if (r.ok) setList(j.facilities ?? []);
      else setMsg(`❌ ${j.error ?? "লোড ব্যর্থ"} — migration চালান`);
    } catch {
      setMsg("❌ নেটওয়ার্ক সমস্যা");
    }
  }

  useEffect(() => {
    // Deferred so the initial fetch (which calls setState on resolve) runs
    // outside the effect body — satisfies react-hooks/set-state-in-effect.
    const t = setTimeout(() => {
      load();
    }, 0);
    return () => clearTimeout(t);
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries(fd.entries());
    try {
      const res = await fetch("/api/admin/facilities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, kind, division_bn: division }),
      });
      const j = await res.json();
      setMsg(res.ok ? "✅ যুক্ত হয়েছে" : `❌ ${j.error ?? "ব্যর্থ"}`);
      if (res.ok) {
        (e.target as HTMLFormElement).reset();
        load();
        router.refresh();
      }
    } catch {
      setMsg("❌ নেটওয়ার্ক সমস্যা");
    }
    setBusy(false);
  }

  async function remove(id: string) {
    if (!confirm("মুছে ফেলবেন?")) return;
    try {
      const res = await fetch("/api/admin/facilities", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) load();
    } catch {
      /* ignore */
    }
  }

  const input = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm";

  return (
    <div>
      <p className="text-sm font-bold">🏥 হাসপাতাল / ডায়াগনস্টিক ({list.length} DB + seed)</p>
      <p className="mt-0.5 text-[11px] text-gray-500">নতুন প্রতিষ্ঠান যোগ করুন — Hospitals/Diagnostics পাতায় দেখা যাবে।</p>
      <form onSubmit={onSubmit} className="mt-3 grid gap-2 sm:grid-cols-2">
        <div className="flex gap-1.5">
          <button type="button" onClick={() => setKind("hospital")} className={`flex-1 rounded-lg border px-3 py-2 text-sm font-bold ${kind === "hospital" ? "border-emerald-700 bg-emerald-700 text-white" : ""}`}>হাসপাতাল</button>
          <button type="button" onClick={() => setKind("diagnostic")} className={`flex-1 rounded-lg border px-3 py-2 text-sm font-bold ${kind === "diagnostic" ? "border-emerald-700 bg-emerald-700 text-white" : ""}`}>ডায়াগনস্টিক</button>
        </div>
        <input name="name_bn" required minLength={3} placeholder="নাম (বাংলা) *" className={input} />
        <input name="name_en" placeholder="English name" className={input} />
        <input name="phone" placeholder="ফোন" className={input} />
        <select value={division} onChange={(e) => setDivision(e.target.value)} className={input}>
          {DIVISIONS.map((d) => <option key={d.name_bn} value={d.name_bn}>{d.name_bn}</option>)}
        </select>
        <select name="district_bn" required className={input} defaultValue="">
          <option value="" disabled>জেলা *</option>
          {districts.map((d) => <option key={d.name_bn} value={d.name_bn}>{d.name_bn}</option>)}
        </select>
        <input name="upazila_area" placeholder="উপজেলা/এলাকা" className={input} />
        <input name="address_bn" placeholder="ঠিকানা" className={input} />
        <button disabled={busy} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-bold text-white disabled:bg-gray-400 sm:col-span-2">
          {busy ? "যোগ হচ্ছে..." : "＋ যুক্ত করুন"}
        </button>
      </form>
      {msg && <p className="mt-2 text-sm font-bold">{msg}</p>}
      {list.length > 0 && (
        <ul className="mt-3 flex flex-col gap-1.5">
          {list.map((x) => (
            <li key={x.id} className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm">
              <span><b>[{x.kind}]</b> {x.name_bn} — {x.district_bn} • {x.phone}</span>
              <button onClick={() => remove(x.id)} className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-bold text-red-600">মুছুন</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
