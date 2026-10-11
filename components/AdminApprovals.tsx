"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck, Search } from "lucide-react";
import {
  completenessScore,
  isValidBdPhone,
} from "@/lib/completeness";

export type ApprovalRow = {
  id: string;
  name_bn: string;
  specialty_bn: string;
  location_district: string;
  location_upazila_area: string;
  appointment_contact: string;
  status: string;
  reports: number;
  chamber_address_bn?: string | null;
  visiting_hours_bn?: string | null;
  visiting_fee_approx?: string | null;
  fee_min?: number | null;
  bmdc_reg_no?: string | null;
};

type BulkAction = "approve" | "reject" | "delete" | "verify";
type QualityFilter =
  | "all"
  | "has_phone"
  | "missing_phone"
  | "has_bmdc"
  | "missing_bmdc"
  | "has_fee"
  | "missing_fee"
  | "has_chamber"
  | "score_5plus"
  | "score_below_3"
  | "reported";
type SortMode = "newest" | "complete" | "reports";

// CMS approvals queue: criteria-based filter + multi-select + bulk actions.
// Every approval writes the verified DB row into the Sheet's Approved tab.
export default function AdminApprovals({ rows }: { rows: ApprovalRow[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [q, setQ] = useState("");
  const [district, setDistrict] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [quality, setQuality] = useState<QualityFilter>("all");
  const [sort, setSort] = useState<SortMode>("newest");
  const [busy, setBusy] = useState<string>("");
  const [msg, setMsg] = useState("");
  const router = useRouter();

  const districts = useMemo(() => [...new Set(rows.map((r) => r.location_district))].sort(), [rows]);
  const specialties = useMemo(() => [...new Set(rows.map((r) => r.specialty_bn))].sort(), [rows]);

  // Pre-compute completeness once
  const scored = useMemo(
    () =>
      rows.map((r) => ({
        row: r,
        c: completenessScore({
          appointment_contact: r.appointment_contact,
          visiting_fee_approx: r.visiting_fee_approx,
          fee_min: r.fee_min,
          visiting_hours_bn: r.visiting_hours_bn,
          chamber_address_bn: r.chamber_address_bn,
          bmdc_reg_no: r.bmdc_reg_no,
          location_district: r.location_district,
          location_upazila_area: r.location_upazila_area,
        }),
      })),
    [rows],
  );

  // Duplicate-phone fraud signal within this queue
  const phoneCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of scored) {
      const p = (s.row.appointment_contact ?? "").replace(/[\s\-()]/g, "");
      if (p) m.set(p, (m.get(p) ?? 0) + 1);
    }
    return m;
  }, [scored]);

  const qualityCounts = useMemo(() => {
    const withPhone = scored.filter((s) => s.c.hasPhone).length;
    return {
      withPhone,
      missingPhone: scored.length - withPhone,
      withBmdc: scored.filter((s) => s.c.hasBmdc).length,
      score5plus: scored.filter((s) => s.c.score >= 5).length,
      reported: scored.filter((s) => s.row.reports > 0).length,
    };
  }, [scored]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let list = scored.filter(({ row: r, c }) => {
      if (district && r.location_district !== district) return false;
      if (specialty && r.specialty_bn !== specialty) return false;
      if (
        needle &&
        !`${r.name_bn} ${r.specialty_bn} ${r.appointment_contact} ${r.location_upazila_area} ${r.bmdc_reg_no ?? ""}`
          .toLowerCase()
          .includes(needle)
      )
        return false;
      switch (quality) {
        case "has_phone":
          if (!c.hasPhone) return false;
          break;
        case "missing_phone":
          if (c.hasPhone) return false;
          break;
        case "has_bmdc":
          if (!c.hasBmdc) return false;
          break;
        case "missing_bmdc":
          if (c.hasBmdc) return false;
          break;
        case "has_fee":
          if (!c.hasFee) return false;
          break;
        case "missing_fee":
          if (c.hasFee) return false;
          break;
        case "has_chamber":
          if (!c.hasChamber) return false;
          break;
        case "score_5plus":
          if (c.score < 5) return false;
          break;
        case "score_below_3":
          if (c.score >= 3) return false;
          break;
        case "reported":
          if (!(r.reports > 0)) return false;
          break;
        default:
          break;
      }
      return true;
    });
    if (sort === "complete") list = [...list].sort((a, b) => b.c.score - a.c.score);
    else if (sort === "reports")
      list = [...list].sort((a, b) => (b.row.reports ?? 0) - (a.row.reports ?? 0));
    return list;
  }, [scored, q, district, specialty, quality, sort]);

  const allChecked = filtered.length > 0 && filtered.every(({ row: r }) => selected.has(r.id));
  const filteredWithPhone = filtered.filter(({ c }) => c.hasPhone).length;

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
        filtered.forEach(({ row: r }) => n.delete(r.id));
        return n;
      });
    } else {
      setSelected((s) => {
        const n = new Set(s);
        filtered.forEach(({ row: r }) => n.add(r.id));
        return n;
      });
    }
  }

  function selectPhoneOnly() {
    setSelected((s) => {
      const n = new Set(s);
      filtered.forEach(({ row: r, c }) => {
        if (c.hasPhone) n.add(r.id);
      });
      return n;
    });
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

  async function verifySingle(id: string) {
    setBusy(id + "verify");
    setMsg("");
    try {
      const res = await fetch("/api/admin/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", ids: [id] }),
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok) {
        setMsg(`✅ যাচাইকৃত (${j.done}/${j.total})`);
        router.refresh();
      } else setMsg(`❌ ${j.error ?? "ব্যর্থ"}`);
    } catch {
      setMsg("❌ নেটওয়ার্ক সমস্যা");
    }
    setBusy("");
  }

  async function bulk(action: BulkAction) {    const ids = [...selected];
    if (!ids.length) return;
    if (action === "delete" && !confirm(`${ids.length}টি মুছে ফেলবেন?`)) return;
    if (action === "approve") {
      const bad = filtered.filter(({ row, c }) => selected.has(row.id) && !c.hasPhone).length;
      if (bad > 0 && !confirm(`${bad}টির ফোন নম্বর নেই/ভুল। তবু Approve করবেন?`)) return;
    }
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
        const label = action === "approve" ? "অনুমোদিত+যাচাইকৃত" : action === "reject" ? "বাতিল" : action === "verify" ? "যাচাইকৃত" : "মোছা";
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
      {/* Criteria summary */}
      <div className="flex flex-wrap gap-1.5 text-[11px]">
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-bold text-emerald-800">☎ {qualityCounts.withPhone} ফোনসহ</span>
        <span className="rounded-full bg-red-50 px-2.5 py-1 font-bold text-red-700">✕ {qualityCounts.missingPhone} ফোনছাড়া</span>
        <span className="rounded-full bg-sky-50 px-2.5 py-1 font-bold text-sky-800">✓ {qualityCounts.withBmdc} BMDC</span>
        <span className="rounded-full bg-amber-50 px-2.5 py-1 font-bold text-amber-800">★ {qualityCounts.score5plus} সম্পূর্ণ (৫+/৬)</span>
        {qualityCounts.reported > 0 && (
          <span className="rounded-full bg-red-100 px-2.5 py-1 font-bold text-red-800">⚑ {qualityCounts.reported} রিপোর্টেড</span>
        )}
      </div>

      {/* Filter bar */}
      <div className="mt-2 flex flex-col gap-1.5 sm:flex-row">
        <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-2 focus-within:border-emerald-600">
          <Search size={14} className="shrink-0 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="নাম / ফোন / এলাকা / BMDC দিয়ে ফিল্টার..."
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
      <div className="mt-1.5 flex flex-col gap-1.5 sm:flex-row">
        <select value={quality} onChange={(e) => setQuality(e.target.value as QualityFilter)} className={`${input} flex-1`} aria-label="তথ্য-সম্পূর্ণতা ফিল্টার">
          <option value="all">সব রেকর্ড ({rows.length})</option>
          <option value="has_phone">☎ ফোন আছে ({qualityCounts.withPhone})</option>
          <option value="missing_phone">✕ ফোন নেই/ভুল ({qualityCounts.missingPhone})</option>
          <option value="has_bmdc">✓ BMDC আছে</option>
          <option value="missing_bmdc">✕ BMDC নেই</option>
          <option value="has_fee">৳ ফি আছে</option>
          <option value="missing_fee">✕ ফি নেই</option>
          <option value="has_chamber">🏥 চেম্বার আছে</option>
          <option value="score_5plus">★ সম্পূর্ণ ৫+/৬ ({qualityCounts.score5plus})</option>
          <option value="score_below_3">⚠ অসম্পূর্ণ (&lt;৩/৬)</option>
          <option value="reported">⚑ রিপোর্টেড</option>
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as SortMode)} className={input} aria-label="সর্ট">
          <option value="newest">নতুন আগে</option>
          <option value="complete">সম্পূর্ণ আগে</option>
          <option value="reports">রিপোর্ট বেশি আগে</option>
        </select>
        <button onClick={selectPhoneOnly} title="ফিল্টার করা তালিকা থেকে শুধু ফোনসহগুলো সিলেক্ট করুন" className="rounded-lg border border-emerald-700 px-2.5 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-50">
          ☎ ফোনসহ সিলেক্ট ({filteredWithPhone})
        </button>
      </div>
      <p className="mt-1.5 text-[11px] text-gray-500">
        {filtered.length}/{rows.length} দেখানো হচ্ছে
        {selected.size > 0 && <> • <b className="text-emerald-700">{selected.size}টি সিলেক্টেড</b></>}
      </p>

      {/* Queue table */}
      <div className="mt-2 overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full min-w-[720px] text-left text-[13px]">
          <thead>
            <tr className="bg-gray-50 text-[11px] uppercase tracking-wide text-gray-500">
              <th className="w-10 p-2.5">
                <input type="checkbox" checked={allChecked} onChange={toggleAll} aria-label="সব সিলেক্ট" className="h-4 w-4 accent-emerald-700" />
              </th>
              <th className="p-2.5">ডাক্তার</th>
              <th className="p-2.5">সম্পূর্ণতা</th>
              <th className="p-2.5">লোকেশন</th>
              <th className="p-2.5 text-right">অ্যাকশন</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(({ row: r, c }) => {
              const phoneOk = isValidBdPhone(r.appointment_contact);
              const dup = (phoneCounts.get((r.appointment_contact ?? "").replace(/[\s\-()]/g, "")) ?? 0) > 1;
              return (
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
                    <p className="font-bold text-gray-900">
                      {r.name_bn}
                      {dup && <span title="একই নম্বরে একাধিক এন্ট্রি — ডুপ্লিকেট হতে পারে" className="ml-1 rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700">2× নম্বর</span>}
                    </p>
                    <p className="mt-0.5 text-[11px] text-gray-500">
                      {r.specialty_bn} •{" "}
                      {phoneOk ? (
                        <a href={`tel:${r.appointment_contact}`} className="font-semibold text-emerald-700">{r.appointment_contact}</a>
                      ) : (
                        <span className="font-bold text-red-600">{r.appointment_contact || "নম্বর নেই"}</span>
                      )}
                      {r.bmdc_reg_no ? <span className="ml-1 text-emerald-700">✓{r.bmdc_reg_no}</span> : <span className="ml-1 text-gray-400">BMDC–</span>}
                      {r.reports > 0 && <span className="ml-1 font-bold text-red-600">⚑{r.reports}</span>}
                    </p>
                    {c.missing.length > 0 && (
                      <p className="mt-0.5 text-[10px] text-gray-400">বাকি: {c.missing.join(" • ")}</p>
                    )}
                  </td>
                  <td className="whitespace-nowrap p-2.5">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${c.score >= 5 ? "bg-emerald-100 text-emerald-800" : c.score >= 3 ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-700"}`}>
                      {c.score}/{c.max}
                    </span>
                    <span className="ml-1 text-[11px]">{phoneOk ? "☎" : "✕"} {r.visiting_fee_approx?.trim() || r.fee_min != null ? "৳" : "৳–"}</span>
                  </td>
                  <td className="whitespace-nowrap p-2.5 text-xs text-gray-600">
                    {r.location_district}/{r.location_upazila_area}
                  </td>
                  <td className="p-2.5">
                    <div className="flex justify-end gap-1">
                      <button
                        disabled={!!busy}
                        onClick={() => single("/api/admin/approve", r.id)}
                        title={phoneOk ? "Approve + যাচাইকৃত + Sheet Approved-এ লিখুন" : "ফোন নেই — তবু Approve করা যাবে (সতর্ক)"}
                        className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-white disabled:opacity-50 ${phoneOk ? "bg-emerald-700 hover:bg-emerald-800" : "bg-amber-600 hover:bg-amber-700"}`}
                      >
                        Approve
                      </button>
                      <button
                        disabled={!!busy}
                        onClick={() => verifySingle(r.id)}
                        title="শুধু যাচাইকৃত ব্যাজ দিন (লাইভই আছে)"
                        className="rounded-lg border border-sky-300 px-2.5 py-1.5 text-[11px] font-bold text-sky-700 hover:bg-sky-50 disabled:opacity-50"
                      >
                        Verify
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
              );
            })}
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
            onClick={() => bulk("verify")}
            className="flex-1 rounded-xl bg-sky-500 px-3 py-2 text-xs font-bold hover:bg-sky-400 disabled:opacity-50"
          >
            {busy === "bulk-verify" ? "…" : `✓ Verify`}
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
