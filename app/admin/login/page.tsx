"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const [token, setToken] = useState("");
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
        body: JSON.stringify({ token }),
      });
      if (res.ok) router.push("/admin");
      else setErr("ভুল টোকেন। আবার চেষ্টা করুন।");
    } catch {
      setErr("নেটওয়ার্ক সমস্যা।");
    }
    setBusy(false);
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-3xl font-bold">অ্যাডমিন লগইন</h1>
      <p className="mt-2 text-lg text-gray-600">ADMIN_TOKEN দিন (শুধু আপনার কাছে থাকে)।</p>
      <form onSubmit={onSubmit} className="mt-4 rounded-2xl border-2 p-5">
        <input type="password" value={token} onChange={(e) => setToken(e.target.value)} required placeholder="টোকেন লিখুন" className="w-full rounded-xl border-2 border-gray-300 px-4 py-3 text-xl" />
        <button disabled={busy} className="touch-target mt-3 w-full rounded-xl bg-emerald-700 text-xl font-bold text-white disabled:bg-gray-400">
          {busy ? "যাচাই হচ্ছে..." : "প্রবেশ করুন"}
        </button>
        {err && <p className="mt-2 text-lg font-bold text-red-600">{err}</p>}
      </form>
    </div>
  );
}
