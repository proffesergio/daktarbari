"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { WEEKDAY_OPTIONS } from "@/lib/schedule";

export type LiveRow = {
  id: string;
  name_bn: string;
  specialty_bn: string;
  location_district: string;
  location_upazila_area: string;
  chamber_address_bn?: string;
  appointment_contact: string;
  visiting_hours_bn?: string;
  visiting_fee_approx?: string;
  bmdc_reg_no?: string | null;
  verified?: boolean;
  consult_available?: boolean;
  schedule?: { off?: string[]; note?: string } | null;
  reports: number;
};

const input = "w-full rounded-lg border border-gray-200 px-2.5 py-2 text-xs outline-none focus:border-emerald-600";

// Live-doctor management: edit any field, availability + schedule,
// unpublish without deleting. Reports triage included.
export default function AdminLive({ rows }: { rows: LiveRow[] }) {
  const [editing, setEditing] = useState<LiveRow | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [verified, setVerified] = useState(true);
  const [consult, setConsult] = useState(true);
  const [off, setOff] = useState<string[]>([]);
  const [schedNote, setSchedNote] = useState("");
  const [schedSlots, setSchedSlots] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");
  const [links, setLinks] = useState<Record<string, string>>({});
  const router = useRouter();

  const reported = rows.filter((r) => r.reports > 0);

  function startEdit(r: LiveRow) {
    setEditing(r);
    setForm({
      name_bn: r.name_bn,
      specialty_bn: r.specialty_bn,
      location_district: r.location_district,
      location_upazila_area: r.location_upazila_area,
      chamber_address_bn: r.chamber_address_bn ?? "",
      appointment_contact: r.appointment_contact,
      visiting_hours_bn: r.visiting_hours_bn ?? "",
      visiting_fee_approx: r.visiting_fee_approx ?? "",
      bmdc_reg_no: r.bmdc_reg_no ?? "",
    });
    setVerified(r.verified !== false);
    setConsult(r.consult_available !== false);
    setOff(r.schedule?.off ?? []);
    setSchedNote(r.schedule?.note ?? "");
    setSchedSlots((r.schedule as { slots?: Record<string, string> } | null)?.slots ?? {});
    setMsg("");
  }

  function set(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function toggleOff(day: string) {
    setOff((o) => (o.includes(day) ? o.filter((d) => d !== day) : [...o, day]));
  }

  async function save() {
    if (!editing) return;
    setBusy("save");
    setMsg("");
    try {
      const res = await fetch("/api/admin/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editing.id,
          ...form,
          verified,
          consult_available: consult,
          schedule: { off, note: schedNote, slots: schedSlots },
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok) {
        setMsg(`✅ সেভ হয়েছে${j.sheet && j.sheet !== "skipped" ? ` • Sheet: ${j.sheet}` : ""}`);
        setEditing(null);
        router.refresh();
      } else setMsg(`❌ ${j.error ?? "ব্যর্থ"}`);
    } catch {
      setMsg("❌ নেটওয়ার্ক সমস্যা");
    }
    setBusy("");
  }

  async function unpublish(id: string) {
    if (!confirm("লাইভ থেকে সরাবেন? (ডিলিট নয় — পরে ফেরানো যাবে)")) return;
    setBusy(id);
    try {
      const res = await fetch("/api/admin/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, unpublish: true }),
      });
      if (res.ok) {
        setMsg("✅ আনপাবলিশ হয়েছে");
        router.refresh();
      } else setMsg("❌ ব্যর্থ");
    } catch {
      setMsg("❌ নেটওয়ার্ক সমস্যা");
    }
    setBusy("");
  }

  async function issueLink(id: string, scope: "edit" | "inbox") {
    setBusy(id + scope);
    try {
      const res = await fetch("/api/admin/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctor_id: id, scope }),
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok && j.link) {
        setLinks((m) => ({ ...m, [id + scope]: j.link as string }));
        setMsg("✅ লিংক তৈরি — ডাক্তার/চেম্বারকে পাঠান");
      } else setMsg(`❌ ${j.error ?? "ব্যর্থ"}`);
    } catch {
      setMsg("❌ নেটওয়ার্ক সমস্যা");
    }
    setBusy("");
  }

  async function triage(doctor_id: string, action: "resolve" | "unpublish") {
    setBusy(doctor_id + action);
    try {
      const res = await fetch("/api/admin/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctor_id, action }),
      });
      if (res.ok) {
        setMsg("✅ সম্পন্ন");
        router.refresh();
      } else setMsg("❌ ব্যর্থ");
    } catch {
      setMsg("❌ নেটওয়ার্ক সমস্যা");
    }
    setBusy("");
  }

  return (
    <div>
      {reported.length > 0 && (
        <div className="mb-3 rounded-xl border border-red-200 bg-red-50/60 p-2.5">
          <p className="text-xs font-bold text-red-800">⚑ রিপোর্টেড ({reported.length}) — আগে দেখুন</p>
          <ul className="mt-1.5 flex flex-col gap-1">
            {reported.map((r) => (
              <li key={r.id} className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-1.5 text-xs">
                <span className="min-w-0 flex-1 truncate"><b>{r.name_bn}</b> <span className="text-red-600">⚑{r.reports}</span></span>
                <button disabled={!!busy} onClick={() => triage(r.id, "resolve")} className="rounded-lg bg-emerald-700 px-2 py-1 font-bold text-white">ঠিক আছে ✓</button>
                <button disabled={!!busy} onClick={() => triage(r.id, "unpublish")} className="rounded-lg border border-red-300 px-2 py-1 font-bold text-red-600">সরান</button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <ul className="flex flex-col gap-1.5">
        {rows.slice(0, 30).map((d) => (
          <li key={d.id} className="flex items-center justify-between gap-2 rounded-xl border border-gray-100 px-3 py-2 text-[13px]">
            <span className="min-w-0">
              <b className="truncate">{d.name_bn}</b> {d.verified === false && <span className="rounded-full bg-amber-100 px-1.5 text-[10px] font-bold text-amber-900">⏳</span>}
              <span className="block truncate text-[11px] text-gray-500">
                {d.specialty_bn} • {d.location_district} • {d.appointment_contact || "নম্বর নেই"}
              </span>
            </span>
            <span className="flex shrink-0 gap-1">
              <Link href={`/doctor/${d.id}`} className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-[11px] font-bold text-gray-700">দেখুন</Link>
              <Link href={`/book/${d.id}`} target="_blank" title="ডাক্তারের শেয়ারযোগ্য বুকিং রুম" className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-[11px] font-bold text-gray-700">📋 বুকিং</Link>
              <button onClick={() => startEdit(d)} className="rounded-lg border border-emerald-700 px-2.5 py-1.5 text-[11px] font-bold text-emerald-800">এডিট</button>
              <button disabled={!!busy} onClick={() => issueLink(d.id, "edit")} title="ডাক্তারের সেলফ-এডিট লিংক তৈরি করুন" className="rounded-lg border border-sky-300 px-2.5 py-1.5 text-[11px] font-bold text-sky-700">✏️ লিংক</button>
              <button disabled={!!busy} onClick={() => issueLink(d.id, "inbox")} title="চেম্বারের সিরিয়াল ইনবক্স লিংক তৈরি করুন" className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-[11px] font-bold text-gray-700">📥 ইনবক্স</button>
              <button disabled={!!busy} onClick={() => unpublish(d.id)} title="লাইভ থেকে সরান" className="rounded-lg border border-red-200 px-2.5 py-1.5 text-[11px] font-bold text-red-600">সরান</button>
            </span>
          </li>
        ))}
        {!rows.length && <p className="text-sm text-gray-500">কোনো লাইভ রেকর্ড নেই।</p>}
      </ul>
      {(links && Object.keys(links).length > 0) && (
        <div className="mt-2 flex flex-col gap-1">
          {Object.entries(links).map(([k, v]) => (
            <p key={k} className="break-all rounded-lg bg-sky-50 px-2.5 py-1.5 text-[11px]">🔗 <b>{v}</b></p>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={() => setEditing(null)}>
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-4 sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-bold">✏️ {editing.name_bn} — এডিট</h3>
            <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {(["name_bn", "specialty_bn", "location_district", "location_upazila_area", "appointment_contact", "visiting_fee_approx", "bmdc_reg_no"] as const).map((k) => (
                <label key={k} className="text-[11px] font-bold text-gray-600">
                  {k}
                  <input value={form[k] ?? ""} onChange={(e) => set(k, e.target.value)} className={`${input} mt-0.5 font-normal`} />
                </label>
              ))}
              <label className="text-[11px] font-bold text-gray-600 sm:col-span-2">
                chamber_address_bn
                <input value={form.chamber_address_bn ?? ""} onChange={(e) => set("chamber_address_bn", e.target.value)} className={`${input} mt-0.5 font-normal`} />
              </label>
              <label className="text-[11px] font-bold text-gray-600 sm:col-span-2">
                visiting_hours_bn
                <input value={form.visiting_hours_bn ?? ""} onChange={(e) => set("visiting_hours_bn", e.target.value)} className={`${input} mt-0.5 font-normal`} />
              </label>
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold">
              <label className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-2">
                <input type="checkbox" checked={verified} onChange={(e) => setVerified(e.target.checked)} className="h-4 w-4 accent-sky-600" /> ✓ যাচাইকৃত
              </label>
              <label className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-2">
                <input type="checkbox" checked={consult} onChange={(e) => setConsult(e.target.checked)} className="h-4 w-4 accent-emerald-600" /> 📋 পরামর্শ চালু
              </label>
            </div>
            <div className="mt-2">
              <p className="text-[11px] font-bold text-gray-600">সাপ্তাহিক বন্ধ (🟢/🔴 ব্যাজের জন্য)</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {WEEKDAY_OPTIONS.map((d) => (
                  <button
                    key={d.en}
                    onClick={() => toggleOff(d.en)}
                    className={`rounded-full border px-2.5 py-1.5 text-[11px] font-bold ${off.includes(d.en) ? "border-red-400 bg-red-50 text-red-700" : "border-gray-200 text-gray-600"}`}
                  >
                    {d.bn}
                  </button>
                ))}
              </div>
              <input value={schedNote} onChange={(e) => setSchedNote(e.target.value)} placeholder="নোট (যেমন: শুক্রবার বন্ধ, ঈদের দিন বন্ধ)" className={`${input} mt-1.5`} />
              <div className="mt-1.5 grid grid-cols-1 gap-1">
                {WEEKDAY_OPTIONS.map((d) => (
                  <div key={d.en} className="flex items-center gap-2">
                    <span className="w-16 shrink-0 text-[11px] font-bold text-gray-600">{d.bn}</span>
                    <input
                      value={schedSlots[d.en] ?? ""}
                      onChange={(e) => setSchedSlots((s) => ({ ...s, [d.en]: e.target.value }))}
                      placeholder="যেমন: সকাল ১০টা–১টা"
                      className="min-w-0 flex-1 rounded-lg border border-gray-200 px-2 py-1.5 text-[11px] outline-none focus:border-emerald-600"
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-3 flex gap-1.5">
              <button disabled={!!busy} onClick={save} className="flex-1 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">
                {busy === "save" ? "…" : "সেভ (প্রোফাইল + Sheet)"}
              </button>
              <button onClick={() => setEditing(null)} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-600">বন্ধ</button>
            </div>
          </div>
        </div>
      )}
      {msg && <p className="mt-2 text-xs font-bold">{msg}</p>}
    </div>
  );
}
