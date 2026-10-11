"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const [token, setToken] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, name: name.trim() || undefined }),
      });
      if (res.ok) router.push("/admin");
      else setErr("ভুল নাম/টোকেন। আবার চেষ্টা করুন।");
    } catch {
      setErr("নেটওয়ার্ক সমস্যা।");
    }
    setBusy(false);
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-3xl font-bold">অ্যাডমিন লগইন</h1>
      <p className="mt-2 text-lg text-gray-600">নাম (ঐচ্ছিক — ব্যক্তিগত টোকেনের জন্য) + টোকেন দিন।</p>
      <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-2.5 rounded-2xl border-2 p-5">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="নাম (মাস্টার টোকেনে খালি রাখুন)" className="w-full rounded-xl border-2 border-gray-300 px-4 py-3 text-xl" />
        <input type="password" value={token} onChange={(e) => setToken(e.target.value)} required placeholder="টোকেন লিখুন" className="w-full rounded-xl border-2 border-gray-300 px-4 py-3 text-xl" />
        <button disabled={busy} className="touch-target mt-1 w-full rounded-xl bg-emerald-700 text-xl font-bold text-white disabled:bg-gray-400">
          {busy ? "যাচাই হচ্ছে..." : "প্রবেশ করুন"}
        </button>
        {err && <p className="mt-2 text-lg font-bold text-red-600">{err}</p>}
      </form>
    </div>
  );
}
