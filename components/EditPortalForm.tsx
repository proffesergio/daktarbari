"use client";

import { useState } from "react";
import { WEEKDAY_OPTIONS } from "@/lib/schedule";

export type PortalDoctor = {
  name_bn: string;
  specialty_bn: string;
  chamber_address_bn: string;
  visiting_hours_bn: string;
  visiting_fee_approx: string;
  consult_available?: boolean;
  schedule?: { off?: string[]; note?: string; slots?: Record<string, string> } | null;
};

// Self-edit portal form: safe fields only (name/phone/BMDC stay admin-only).
export default function EditPortalForm({ token, doctor }: { token: string; doctor: PortalDoctor }) {
  const [chamber, setChamber] = useState(doctor.chamber_address_bn ?? "");
  const [hours, setHours] = useState(doctor.visiting_hours_bn ?? "");
  const [fee, setFee] = useState(doctor.visiting_fee_approx ?? "");
  const [consult, setConsult] = useState(doctor.consult_available !== false);
  const [off, setOff] = useState<string[]>(doctor.schedule?.off ?? []);
  const [note, setNote] = useState(doctor.schedule?.note ?? "");
  const [slots, setSlots] = useState<Record<string, string>>(doctor.schedule?.slots ?? {});
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  function toggleOff(day: string) {
    setOff((o) => (o.includes(day) ? o.filter((d) => d !== day) : [...o, day]));
  }

  async function save() {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch(`/api/edit/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chamber_address_bn: chamber,
          visiting_hours_bn: hours,
          visiting_fee_approx: fee,
          consult_available: consult,
          schedule: { off, note, slots },
        }),
      });
      const j = await res.json().catch(() => ({}));
      setMsg(res.ok ? "✅ সেভ হয়েছে — প্রোফাইলে দেখা যাবে।" : `❌ ${j.error ?? "ব্যর্থ"}`);
    } catch {
      setMsg("❌ নেটওয়ার্ক সমস্যা");
    }
    setBusy(false);
  }

  const input = "w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-600";

  return (
    <div className="mt-4 flex flex-col gap-2.5 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <p className="text-sm text-gray-600">
        <b>{doctor.name_bn}</b> • {doctor.specialty_bn} — শুধু নিরাপদ তথ্য বদলানো যায় (নাম/ফোন/BMDC বদলাতে অ্যাডমিনকে জানান)।
      </p>
      <label className="text-xs font-bold text-gray-700">🏥 চেম্বার ঠিকানা
        <textarea value={chamber} onChange={(e) => setChamber(e.target.value)} rows={2} className={`${input} mt-1 font-normal`} />
      </label>
      <label className="text-xs font-bold text-gray-700">🕒 রোগী দেখার সময়
        <input value={hours} onChange={(e) => setHours(e.target.value)} className={`${input} mt-1 font-normal`} />
      </label>
      <label className="text-xs font-bold text-gray-700">৳ ভিজিট ফি
        <input value={fee} onChange={(e) => setFee(e.target.value)} className={`${input} mt-1 font-normal`} />
      </label>
      <label className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-bold">
        <input type="checkbox" checked={consult} onChange={(e) => setConsult(e.target.checked)} className="h-5 w-5 accent-emerald-600" />
        📋 এখন পরামর্শ দিচ্ছি
      </label>
      <div>
        <p className="text-xs font-bold text-gray-700">সাপ্তাহিক বন্ধের দিন</p>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {WEEKDAY_OPTIONS.map((d) => (
            <button
              key={d.en}
              onClick={() => toggleOff(d.en)}
              className={`rounded-full border px-3 py-2 text-xs font-bold ${off.includes(d.en) ? "border-red-400 bg-red-50 text-red-700" : "border-gray-200 text-gray-600"}`}
            >
              {d.bn}
            </button>
          ))}
        </div>
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="নোট (যেমন: শুক্রবার বন্ধ)" className={`${input} mt-2`} />
      </div>
      <div>
        <p className="text-xs font-bold text-gray-700">প্রতিদিনের সময় (ঐচ্ছিক — যেমন: সকাল ১০টা–১টা)</p>
        <div className="mt-1 grid grid-cols-1 gap-1.5">
          {WEEKDAY_OPTIONS.map((d) => (
            <div key={d.en} className="flex items-center gap-2">
              <span className="w-20 shrink-0 text-xs font-bold text-gray-600">{d.bn}</span>
              <input
                value={slots[d.en] ?? ""}
                onChange={(e) => setSlots((s) => ({ ...s, [d.en]: e.target.value }))}
                placeholder="—"
                className="min-w-0 flex-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs outline-none focus:border-emerald-600"
              />
            </div>
          ))}
        </div>
      </div>
      <button onClick={save} disabled={busy} className="rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white disabled:bg-gray-400">
        {busy ? "…" : "সেভ করুন"}
      </button>
      {msg && <p className="text-sm font-bold">{msg}</p>}
    </div>
  );
}
