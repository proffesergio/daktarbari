"use client";

import { useState } from "react";
import Link from "next/link";

export type ActivityEvent = { id: string; kind: string; doctor_id: string | null; query: string; meta: string; created_at: string; doctor_name?: string };
export type AuditRow = { id: string; action: string; doctor_id: string | null; detail: string; created_at: string; doctor_name?: string };
export type TopRow = { key: string; name?: string; count: number };
export type GapRow = { query: string; label: string; times: number; lastAt: string };

const KIND_BN: Record<string, string> = {
  profile_view: "👁️ প্রোফাইল",
  call_tap: "📞 কল",
  whatsapp_tap: "💬 WhatsApp",
  search: "🔍 সার্চ",
  serial_submit: "📋 সিরিয়াল",
  review_submit: "⭐ রিভিউ",
};

// Unified hub: user activity (views/calls/searches) + votes + admin audit trail.
export default function ActivityHub({
  events,
  audits,
  topContacts,
  topQueries,
  totalEvents,
  gaps,
}: {
  events: ActivityEvent[];
  audits: AuditRow[];
  topContacts: TopRow[];
  topQueries: TopRow[];
  totalEvents: number;
  gaps: GapRow[];
}) {
  const [kind, setKind] = useState("ALL");
  const [view, setView] = useState<"events" | "audit" | "gaps">("events");
  const shown = events.filter((e) => kind === "ALL" || e.kind === kind);

  return (
    <div>
      <div className="grid grid-cols-2 gap-1.5">
        <div className="rounded-xl bg-gray-50 p-2.5">
          <p className="text-[11px] font-bold uppercase text-gray-500">📞 সর্বাধিক যোগাযোগ</p>
          {topContacts.length === 0 && <p className="mt-1 text-[11px] text-gray-400">তথ্য নেই</p>}
          {topContacts.slice(0, 5).map((t) => (
            <p key={t.key} className="mt-1 truncate text-xs">
              <Link href={`/doctor/${t.key}`} className="font-bold text-emerald-800">{t.name || t.key.slice(0, 8)}</Link>
              <span className="ml-1 text-gray-500">×{t.count}</span>
            </p>
          ))}
        </div>
        <div className="rounded-xl bg-gray-50 p-2.5">
          <p className="text-[11px] font-bold uppercase text-gray-500">🔍 জনপ্রিয় সার্চ</p>
          {topQueries.length === 0 && <p className="mt-1 text-[11px] text-gray-400">তথ্য নেই</p>}
          {topQueries.slice(0, 5).map((t) => (
            <p key={t.key} className="mt-1 truncate text-xs">“{t.key}” <span className="text-gray-500">×{t.count}</span></p>
          ))}
        </div>
      </div>
      <div className="mt-2.5 flex gap-1.5">
        <button onClick={() => setView("events")} className={`rounded-full px-3 py-1.5 text-xs font-bold ${view === "events" ? "bg-emerald-700 text-white" : "border border-gray-200 text-gray-600"}`}>
          ব্যবহারকারী ({totalEvents})
        </button>
        <button onClick={() => setView("audit")} className={`rounded-full px-3 py-1.5 text-xs font-bold ${view === "audit" ? "bg-emerald-700 text-white" : "border border-gray-200 text-gray-600"}`}>
          অ্যাডমিন লগ ({audits.length})
        </button>
        <button onClick={() => setView("gaps")} className={`rounded-full px-3 py-1.5 text-xs font-bold ${view === "gaps" ? "bg-amber-600 text-white" : "border border-gray-200 text-gray-600"}`}>
          তথ্য-ঘাটতি ({gaps.length})
        </button>
        {view === "events" && (
          <select value={kind} onChange={(e) => setKind(e.target.value)} className="ml-auto rounded-lg border border-gray-200 px-2 py-1.5 text-xs">
            <option value="ALL">সব</option>
            {Object.entries(KIND_BN).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        )}
      </div>
      {view === "events" ? (
        shown.length === 0 ? (
          <p className="mt-2 text-xs text-gray-500">কোনো ইভেন্ট নেই — প্রোফাইল ভিউ/কল ট্র্যাকিং চালু আছে।</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-1">
            {shown.slice(0, 40).map((e) => (
              <li key={e.id} className="rounded-lg border border-gray-100 px-2.5 py-1.5 text-xs">
                <b>{KIND_BN[e.kind] ?? e.kind}</b>{" "}
                {e.doctor_id && <Link href={`/doctor/${e.doctor_id}`} className="font-bold text-emerald-800">{e.doctor_name || e.doctor_id.slice(0, 8)}</Link>}
                {e.query && <span className="text-gray-600"> “{e.query}”</span>}
                {e.meta && <span className="text-gray-500"> ({e.meta})</span>}
                <span className="ml-1 text-[10px] text-gray-400">{new Date(e.created_at).toLocaleString("bn-BD")}</span>
              </li>
            ))}
          </ul>
        )
      ) : view === "audit" ? (
        audits.length === 0 ? (
          <p className="mt-2 text-xs text-gray-500">অ্যাডমিন লগ খালি — migration চালানোর পর থেকে রেকর্ড হবে।</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-1">
            {audits.slice(0, 40).map((a) => (
              <li key={a.id} className="rounded-lg border border-gray-100 px-2.5 py-1.5 text-xs">
                <b className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[11px] text-emerald-800">{a.action}</b>{" "}
                {a.doctor_id && <Link href={`/doctor/${a.doctor_id}`} className="font-bold text-emerald-800">{a.doctor_name || a.doctor_id.slice(0, 8)}</Link>}
                {a.detail && <span className="text-gray-600"> — {a.detail}</span>}
                <span className="ml-1 text-[10px] text-gray-400">{new Date(a.created_at).toLocaleString("bn-BD")}</span>
              </li>
            ))}
          </ul>
        )
      ) : (
        <div>
          <p className="mt-2 text-xs text-gray-600">ফলাফল শূন্য আসা সার্চ — এই তথ্য আগে সংগ্রহ করুন। <Link href="/add" className="font-bold text-emerald-700 underline">+ তথ্য যোগ করুন</Link></p>
          {gaps.length === 0 ? (
            <p className="mt-2 text-xs text-gray-500">কোনো শূন্য-ফলাফল সার্চ নেই।</p>
          ) : (
            <ul className="mt-2 flex flex-col gap-1">
              {gaps.slice(0, 20).map((g, i) => (
                <li key={i} className="rounded-lg border border-amber-200 bg-amber-50/50 px-2.5 py-1.5 text-xs">
                  <b>“{g.query || "—"}”</b> <span className="text-gray-600">{g.label}</span>
                  <span className="ml-1 font-bold text-amber-700">×{g.times} বার খালি</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
