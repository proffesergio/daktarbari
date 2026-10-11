"use client";

import { useState } from "react";

// "This is my profile" claim — instant via OTP, or manual admin review.
export default function ClaimForm({ doctorId }: { doctorId: string }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"otp" | "manual">("otp");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [editLink, setEditLink] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const phoneOk = /^01[3-9]\d{8}$/.test(phone.replace(/[\s\-()]/g, ""));

  async function sendCode() {
    if (busy) return;
    if (!phoneOk) return setMsg("❌ সঠিক ১১ সংখ্যার মোবাইল নম্বর দিন");
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/claims/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "request", phone }),
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok) {
        setCodeSent(true);
        setMsg("✅ কোড পাঠানো হয়েছে — SMS দেখুন।");
      } else setMsg(`❌ ${j.error ?? "ব্যর্থ"}`);
    } catch {
      setMsg("❌ নেটওয়ার্ক সমস্যা");
    }
    setBusy(false);
  }

  async function verifyCode() {
    if (busy) return;
    if (name.trim().length < 2) return setMsg("❌ আপনার নাম দিন");
    if (code.trim().length < 4) return setMsg("❌ ৬ সংখ্যার কোড দিন");
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/claims/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "verify", phone, code, doctor_id: doctorId, claimant_name: name, note }),
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok) {
        setMsg("✅ ফোন যাচাই হয়েছে — প্রোফাইল আপনার!");
        if (j.editLink) setEditLink(j.editLink as string);
      } else setMsg(`❌ ${j.error ?? "ব্যর্থ"}`);
    } catch {
      setMsg("❌ নেটওয়ার্ক সমস্যা");
    }
    setBusy(false);
  }

  async function submitManual() {
    if (busy) return;
    if (name.trim().length < 2) return setMsg("❌ আপনার নাম দিন");
    if (!phoneOk) return setMsg("❌ সঠিক ১১ সংখ্যার মোবাইল নম্বর দিন");
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctor_id: doctorId, claimant_name: name, claimant_phone: phone, note }),
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok) {
        setMsg("✅ অনুরোধ গেছে — ফোনে যাচাই করে প্রোফাইল হস্তান্তর করা হবে।");
        setName("");
        setPhone("");
        setNote("");
      } else setMsg(`❌ ${j.error ?? "ব্যর্থ"}`);
    } catch {
      setMsg("❌ নেটওয়ার্ক সমস্যা");
    }
    setBusy(false);
  }

  const input = "w-full rounded-xl border border-gray-200 px-3 py-2 text-xs outline-none focus:border-emerald-600";

  return (
    <div className="mt-3 rounded-2xl border border-sky-100 bg-sky-50/50 p-3">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between text-left">
        <span className="text-sm font-bold text-sky-900">🩺 আপনি কি এই ডাক্তার? প্রোফাইল দাবি করুন</span>
        <span className="text-xs font-bold text-sky-700">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="mt-2 flex flex-col gap-1.5">
          <div className="flex gap-1.5">
            <button onClick={() => setMode("otp")} className={`flex-1 rounded-xl border px-3 py-2 text-xs font-bold ${mode === "otp" ? "border-sky-700 bg-sky-700 text-white" : "border-gray-200 bg-white text-gray-700"}`}>
              ⚡ OTP-তে সঙ্গে সঙ্গে
            </button>
            <button onClick={() => setMode("manual")} className={`flex-1 rounded-xl border px-3 py-2 text-xs font-bold ${mode === "manual" ? "border-sky-700 bg-sky-700 text-white" : "border-gray-200 bg-white text-gray-700"}`}>
              📞 অ্যাডমিন যাচাই
            </button>
          </div>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="আপনার নাম" className={input} />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="মোবাইল (01XXXXXXXXX)" inputMode="numeric" className={input} />
          {mode === "otp" ? (
            <>
              {!codeSent ? (
                <button onClick={sendCode} disabled={busy} className="rounded-xl bg-sky-700 px-4 py-2 text-xs font-bold text-white disabled:bg-gray-400">
                  {busy ? "…" : "SMS কোড পাঠান"}
                </button>
              ) : (
                <>
                  <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="৬ সংখ্যার কোড" inputMode="numeric" className={input} />
                  <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="BMDC নম্বর (ঐচ্ছিক)" className={input} />
                  <div className="flex gap-1.5">
                    <button onClick={verifyCode} disabled={busy} className="flex-1 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white disabled:bg-gray-400">
                      {busy ? "…" : "যাচাই করুন"}
                    </button>
                    <button onClick={sendCode} disabled={busy} className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-bold text-gray-600">
                      আবার
                    </button>
                  </div>
                </>
              )}
              {editLink && (
                <p className="break-all rounded-lg bg-emerald-50 px-2.5 py-2 text-xs">✏️ আপনার এডিট লিংক: <b>{editLink}</b></p>
              )}
            </>
          ) : (
            <>
              <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="BMDC নম্বর / বাড়তি তথ্য" className={input} />
              <button onClick={submitManual} disabled={busy} className="rounded-xl bg-sky-700 px-4 py-2 text-xs font-bold text-white disabled:bg-gray-400">
                {busy ? "…" : "দাবি পাঠান"}
              </button>
            </>
          )}
          {msg && <p className="text-xs font-bold">{msg}</p>}
        </div>
      )}
    </div>
  );
}
