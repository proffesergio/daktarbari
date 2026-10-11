"use client";

import { useState } from "react";
import { track } from "@/lib/track";

// Serial / consultation request form (chamber visit or online consult).
export default function SerialForm({ doctorId, onlineOk = true }: { doctorId: string; onlineOk?: boolean }) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<"chamber" | "online">("chamber");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (busy) return;
    if (name.trim().length < 2) return setMsg("❌ আপনার নাম দিন");
    if (!/^01[3-9]\d{8}$/.test(phone.replace(/[\s\-()]/g, ""))) return setMsg("❌ সঠিক ১১ সংখ্যার মোবাইল নম্বর দিন");
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/serial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctor_id: doctorId, kind, patient_name: name, patient_phone: phone, preferred_date: date, note }),
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok) {
        setMsg("✅ অনুরোধ গেছে — চেম্বার থেকে ফোনে নিশ্চিত করা হবে।");
        track("serial_submit", doctorId, kind);
        setName("");
        setPhone("");
        setDate("");
        setNote("");
      } else setMsg(`❌ ${j.error ?? "ব্যর্থ"}`);
    } catch {
      setMsg("❌ নেটওয়ার্ক সমস্যা");
    }
    setBusy(false);
  }

  const input = "w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-600";

  return (
    <div className="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-3">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between text-left">
        <span className="text-sm font-bold text-emerald-900">📋 সিরিয়াল / পরামর্শের অনুরোধ</span>
        <span className="text-xs font-bold text-emerald-700">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="mt-2 flex flex-col gap-2">
          {onlineOk && (
            <div className="flex gap-1.5">
              {(["chamber", "online"] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => setKind(k)}
                  className={`flex-1 rounded-xl border px-3 py-2 text-xs font-bold ${kind === k ? "border-emerald-700 bg-emerald-700 text-white" : "border-gray-200 bg-white text-gray-700"}`}
                >
                  {k === "chamber" ? "🏥 চেম্বারে দেখা" : "📱 অনলাইন পরামর্শ"}
                </button>
              ))}
            </div>
          )}
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="রোগীর নাম" className={input} />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="মোবাইল (01XXXXXXXXX)" inputMode="numeric" className={input} />
          <input value={date} onChange={(e) => setDate(e.target.value)} placeholder="পছন্দের তারিখ (যেমন: শুক্রবার বিকাল)" className={input} />
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="সমস্যা সংক্ষেপে (ঐচ্ছিক)" rows={2} className={input} />
          <button onClick={submit} disabled={busy} className="rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white disabled:bg-gray-400">
            {busy ? "…" : "অনুরোধ পাঠান"}
          </button>
          {msg && <p className="text-xs font-bold">{msg}</p>}
        </div>
      )}
    </div>
  );
}
