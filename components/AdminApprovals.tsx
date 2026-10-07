"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck, Search } from "lucide-react";

export type ApprovalRow = {
  id: string;
  name_bn: string;
  specialty_bn: string;
  location_district: string;
  location_upazila_area: string;
  appointment_contact: string;
  status: string;
  reports: number;
};

type BulkAction = "approve" | "reject" | "delete";

// CMS approvals queue: filter + multi-select + bulk actions.
// Every approval writes the verified DB row into the Sheet's Approved tab.
export default function AdminApprovals({ rows }: { rows: ApprovalRow[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [q, setQ] = useState("");
  const [district, setDistrict] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [busy, setBusy] = useState<string>("");
  const [msg, setMsg] = useState("");
  const router = useRouter();

  const districts = useMemo(() => [...new Set(rows.map((r) => r.location_district))].sort(), [rows]);
  const specialties = useMemo(() => [...new Set(rows.map((r) => r.specialty_bn))].sort(), [rows]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (!district || r.location_district === district) &&
        (!specialty || r.specialty_bn === specialty) &&
        (!needle ||
          `${r.name_bn} ${r.specialty_bn} ${r.appointment_contact} ${r.location_upazila_area}`
            .toLowerCase()
            .includes(needle)),
    );
  }, [rows, q, district, specialty]);

  const allChecked = filtered.length > 0 && filtered.every((r) => selected.has(r.id));

  function toggle(id: string) {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function toggleAll() {
    if (allChecked) {
      setSelected((s) => {
        const n = new Set(s);
        filtered.forEach((r) => n.delete(r.id));
        return n;
      });
    } else {
      setSelected((s) => {
        const n = new Set(s);
        filtered.forEach((r) => n.add(r.id));
        return n;
      });
    }
  }

  async function single(path: string, id: string) {
    setBusy(id + path);
    setMsg("");
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok) {
        setSelected((s) => {
          const n = new Set(s);
          n.delete(id);
          return n;
        });
        setMsg(`✅ সফল${j.sheet && j.sheet !== "skipped" ? ` • Sheet: ${j.sheet}` : ""}`);
        router.refresh();
      } else setMsg(`❌ ${j.error ?? "ব্যর্থ"}`);
    } catch {
      setMsg("❌ নেটওয়ার্ক সমস্যা");
    }
    setBusy("");
  }

  async function bulk(action: BulkAction) {
    const ids = [...selected];
    if (!ids.length) return;
    if (action === "delete" && !confirm(`${ids.length}টি মুছে ফেলবেন?`)) return;
    setBusy(`bulk-${action}`);
    setMsg("");
    try {
      const res = await fetch("/api/admin/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ids }),
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok) {
        setSelected(new Set());
        const label = action === "approve" ? "অনুমোদিত" : action === "reject" ? "বাতিল" : "মোছা";
        setMsg(`✅ ${j.done}/${j.total}টি ${label}${j.sheetOk ? ` • Sheet ✓${j.sheetOk}` : ""}`);
        router.refresh();
      } else setMsg(`❌ ${j.error ?? "ব্যর্থ"}`);
    } catch {
      setMsg("❌ নেটওয়ার্ক সমস্যা");
    }
    setBusy("");
  }

  const input = "rounded-lg border border-gray-200 px-2.5 py-2 text-xs outline-none focus:border-emerald-600";

  if (rows.length === 0)
    return (
      <div className="rounded-xl border border-dashed p-6 text-center text-sm text-gray-500">
        পেন্ডিং কিউ খালি — নতুন জমা এলে এখানে দেখা যাবে।
      </div>
    );

  return (
    <div>
      {/* Filter bar */}
      <div className="flex flex-col gap-1.5 sm:flex-row">
        <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-2 focus-within:border-emerald-600">
          <Search size={14} className="shrink-0 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="নাম / ফোন / এলাকা দিয়ে ফিল্টার..."
            className="w-full bg-transparent text-xs outline-none"
          />
        </div>
        <select value={district} onChange={(e) => setDistrict(e.target.value)} className={input}>
          <option value="">সব জেলা</option>
          {districts.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <select value={specialty} onChange={(e) => setSpecialty(e.target.value)} className={input}>
          <option value="">সব বিশেষজ্ঞ</option>
          {specialties.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      <p className="mt-1.5 text-[11px] text-gray-500">
        {filtered.length}/{rows.length} দেখানো হচ্ছে
        {selected.size > 0 && <> • <b className="text-emerald-700">{selected.size}টি সিলেক্টেড</b></>}
      </p>

      {/* Queue table */}
      <div className="mt-2 overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full min-w-[680px] text-left text-[13px]">
          <thead>
            <tr className="bg-gray-50 text-[11px] uppercase tracking-wide text-gray-500">
              <th className="w-10 p-2.5">
                <input type="checkbox" checked={allChecked} onChange={toggleAll} aria-label="সব সিলেক্ট" className="h-4 w-4 accent-emerald-700" />
              </th>
              <th className="p-2.5">ডাক্তার</th>
              <th className="p-2.5">লোকেশন</th>
              <th className="p-2.5 text-right">অ্যাকশন</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className={`border-t border-gray-100 ${selected.has(r.id) ? "bg-emerald-50/60" : "bg-white"}`}>
                <td className="p-2.5">
                  <input
                    type="checkbox"
                    checked={selected.has(r.id)}
                    onChange={() => toggle(r.id)}
                    aria-label={r.name_bn}
                    className="h-4 w-4 accent-emerald-700"
                  />
                </td>
                <td className="p-2.5">
                  <p className="font-bold text-gray-900">{r.name_bn}</p>
                  <p className="mt-0.5 text-[11px] text-gray-500">
                    {r.specialty_bn} • <a href={`tel:${r.appointment_contact}`} className="font-semibold text-emerald-700">{r.appointment_contact || "নম্বর নেই"}</a>
                    {r.reports > 0 && <span className="ml-1 font-bold text-red-600">⚑{r.reports}</span>}
                  </p>
                </td>
                <td className="whitespace-nowrap p-2.5 text-xs text-gray-600">
                  {r.location_district}/{r.location_upazila_area}
                </td>
                <td className="p-2.5">
                  <div className="flex justify-end gap-1">
                    <button
                      disabled={!!busy}
                      onClick={() => single("/api/admin/approve", r.id)}
                      title="Approve + Sheet Approved-এ লিখুন"
                      className="rounded-lg bg-emerald-700 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-800 disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      disabled={!!busy}
                      onClick={() => single("/api/admin/reject", r.id)}
                      className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-[11px] font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Reject
                    </button>
                    <button
                      disabled={!!busy}
                      onClick={() => {
                        if (confirm("মুছে ফেলবেন?")) single("/api/admin/delete", r.id);
                      }}
                      className="rounded-lg border border-red-200 px-2.5 py-1.5 text-[11px] font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      Del
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="p-5 text-center text-xs text-gray-500">ফিল্টারে কিছু মেলেনি।</p>
        )}
      </div>

      {/* Sticky bulk bar */}
      {selected.size > 0 && (
        <div className="animate-fade-up sticky bottom-20 z-10 mt-3 flex flex-wrap items-center gap-1.5 rounded-2xl bg-emerald-950 p-2.5 text-white shadow-xl md:bottom-4">
          <span className="flex items-center gap-1.5 px-1.5 text-xs font-bold">
            <CheckCheck size={15} /> {selected.size}টি সিলেক্টেড
          </span>
          <button
            disabled={!!busy}
            onClick={() => bulk("approve")}
            className="flex-1 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-bold hover:bg-emerald-400 disabled:opacity-50"
          >
            {busy === "bulk-approve" ? "…" : `✓ Approve + Sheet`}
          </button>
          <button
            disabled={!!busy}
            onClick={() => bulk("reject")}
            className="flex-1 rounded-xl bg-white/10 px-3 py-2 text-xs font-bold hover:bg-white/20 disabled:opacity-50"
          >
            Reject
          </button>
          <button
            disabled={!!busy}
            onClick={() => bulk("delete")}
            className="flex-1 rounded-xl bg-red-500/90 px-3 py-2 text-xs font-bold hover:bg-red-500 disabled:opacity-50"
          >
            Delete
          </button>
          <button onClick={() => setSelected(new Set())} className="px-2 text-[11px] font-bold text-emerald-200">
            মুছুন ✕
          </button>
        </div>
      )}
      {msg && <p className="mt-2 text-xs font-bold">{msg}</p>}
    </div>
  );
}
