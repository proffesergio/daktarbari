"use client";

import { useEffect, useState } from "react";

type Req = {
  id: string;
  kind: string;
  patient_name: string;
  patient_phone: string;
  preferred_date: string;
  note: string;
  status: string;
  created_at: string;
};

// Chamber-side inbox: confirm/cancel own serial requests, no admin login.
export default function InboxClient({ token }: { token: string }) {
  const [name, setName] = useState("");
  const [reqs, setReqs] = useState<Req[]>([]);
  const [filter, setFilter] = useState("PENDING");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState("");
  const [dead, setDead] = useState(false);

  async function load() {
    try {
      const r = await fetch(`/api/inbox/${token}`, { cache: "no-store" });
      const j = await r.json();
      if (!r.ok) {
        setDead(true);
        return;
      }
      setName(j.doctor?.name_bn ?? "");
      setReqs(j.requests ?? []);
    } catch {
      setDead(true);
    }
  }

  useEffect(() => {
    // Deferred so the initial fetch (which calls setState on resolve) runs
    // outside the effect body — satisfies react-hooks/set-state-in-effect.
    const t = setTimeout(() => {
      load();
    }, 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function act(id: string, action: "confirm" | "cancel") {
    setBusy(id + action);
    try {
      const res = await fetch(`/api/inbox/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      if (res.ok) {
        setMsg("✅ সম্পন্ন");
        load();
      } else setMsg("❌ ব্যর্থ");
    } catch {
      setMsg("❌ নেটওয়ার্ক সমস্যা");
    }
    setBusy("");
  }

  if (dead)
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 text-center">
        <p className="text-xl font-bold">লিংকটি ভুল বা মেয়াদোত্তীর্ণ</p>
        <p className="mt-1 text-sm text-gray-600">নতুন লিংকের জন্য অ্যাডমিনের সাথে যোগাযোগ করুন।</p>
      </div>
    );

  const shown = reqs.filter((r) => (filter === "ALL" ? true : r.status === filter));

  return (
    <div className="mx-auto max-w-3xl px-3 py-5 pb-24 sm:pb-8">
      <h1 className="text-lg font-bold">📥 সিরিয়াল ইনবক্স{name && ` — ${name}`}</h1>
      <div className="mt-3 flex gap-1.5">
        {(["PENDING", "CONFIRMED", "CANCELLED", "ALL"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full px-3 py-2 text-xs font-bold ${filter === s ? "bg-emerald-700 text-white" : "border border-gray-200 bg-white text-gray-600"}`}
          >
            {s === "PENDING" ? "বাকি" : s === "CONFIRMED" ? "নিশ্চিত" : s === "CANCELLED" ? "বাতিল" : "সব"}
          </button>
        ))}
      </div>
      {shown.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed p-6 text-center text-sm text-gray-500">কোনো অনুরোধ নেই।</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {shown.map((r) => (
            <li key={r.id} className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
              <p className="text-sm">
                <b>{r.patient_name}</b> <a href={`tel:${r.patient_phone}`} className="font-bold text-emerald-700">{r.patient_phone}</a>
                <span className="ml-1 rounded-full bg-gray-100 px-2 py-0.5 text-[11px]">{r.kind === "online" ? "📱 অনলাইন" : "🏥 চেম্বার"}</span>
              </p>
              <p className="mt-1 text-[13px] text-gray-600">
                {[r.preferred_date, r.note].filter(Boolean).join(" • ") || "—"}
              </p>
              {r.status === "PENDING" ? (
                <div className="mt-2 flex gap-1.5">
                  <button disabled={!!busy} onClick={() => act(r.id, "confirm")} className="flex-1 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">
                    ✓ নিশ্চিত করুন
                  </button>
                  <button disabled={!!busy} onClick={() => act(r.id, "cancel")} className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-600 disabled:opacity-50">
                    বাতিল
                  </button>
                </div>
              ) : (
                <p className="mt-1 text-xs font-bold text-gray-500">{r.status === "CONFIRMED" ? "✅ নিশ্চিত" : "✕ বাতিল"}</p>
              )}
            </li>
          ))}
        </ul>
      )}
      {msg && <p className="mt-2 text-sm font-bold">{msg}</p>}
    </div>
  );
}
