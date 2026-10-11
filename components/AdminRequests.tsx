"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export type SerialRow = {
  id: string;
  doctor_id: string;
  kind: string;
  patient_name: string;
  patient_phone: string;
  preferred_date: string;
  note: string;
  status: string;
  created_at: string;
  doctor_name?: string;
};

export type ClaimRow = {
  id: string;
  doctor_id: string;
  claimant_name: string;
  claimant_phone: string;
  note: string;
  status: string;
  created_at: string;
  doctor_name?: string;
};

// Chamber inbox: serial/consult requests + profile claims in one place.
export default function AdminRequests({ serials, claims }: { serials: SerialRow[]; claims: ClaimRow[] }) {
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");
  const [editLinks, setEditLinks] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState("PENDING");
  const [notifs, setNotifs] = useState<{ id: string; channel: string; to_phone: string; body: string; status: string; error: string }[]>([]);
  const router = useRouter();

  useEffect(() => {
    let alive = true;
    fetch("/api/admin/notify", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        if (alive && j.notifications) setNotifs(j.notifications);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  async function retryNotif(id: string) {
    setBusy(id);
    try {
      const res = await fetch("/api/admin/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const j = await res.json().catch(() => ({}));
      setMsg(res.ok ? "✅ পাঠানো হয়েছে" : `❌ ${j.error ?? "ব্যর্থ"}`);
      if (res.ok) router.refresh();
    } catch {
      setMsg("❌ নেটওয়ার্ক সমস্যা");
    }
    setBusy("");
  }

  async function act(path: string, id: string, action: string) {
    setBusy(id + action);
    setMsg("");
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok) {
        if (j.editLink) setEditLinks((m) => ({ ...m, [id]: j.editLink as string }));
        setMsg("✅ সম্পন্ন");
        router.refresh();
      } else setMsg(`❌ ${j.error ?? "ব্যর্থ"}`);
    } catch {
      setMsg("❌ নেটওয়ার্ক সমস্যা");
    }
    setBusy("");
  }

  const pendSerials = serials.filter((s) => (filter === "ALL" ? true : s.status === filter));

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold">📋 সিরিয়াল / পরামর্শ অনুরোধ ({serials.filter((s) => s.status === "PENDING").length} বাকি)</h3>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="ml-auto rounded-lg border border-gray-200 px-2 py-1.5 text-xs">
            <option value="PENDING">বাকি</option>
            <option value="CONFIRMED">নিশ্চিত</option>
            <option value="CANCELLED">বাতিল</option>
            <option value="ALL">সব</option>
          </select>
        </div>
        {pendSerials.length === 0 ? (
          <p className="mt-2 text-xs text-gray-500">কোনো অনুরোধ নেই।</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-1.5">
            {pendSerials.slice(0, 30).map((s) => (
              <li key={s.id} className="rounded-xl border border-gray-100 px-3 py-2 text-[13px]">
                <p>
                  <b>{s.patient_name}</b> <a href={`tel:${s.patient_phone}`} className="font-semibold text-emerald-700">{s.patient_phone}</a>
                  <span className="ml-1 rounded-full bg-gray-100 px-2 py-0.5 text-[11px]">{s.kind === "online" ? "📱 অনলাইন" : "🏥 চেম্বার"}</span>
                </p>
                <p className="mt-0.5 text-xs text-gray-600">
                  → <Link href={`/doctor/${s.doctor_id}`} className="font-bold text-emerald-800">{s.doctor_name || s.doctor_id.slice(0, 8)}</Link>
                  {s.preferred_date && <> • {s.preferred_date}</>}
                  {s.note && <> • “{s.note}”</>}
                </p>
                {s.status === "PENDING" && (
                  <div className="mt-1.5 flex gap-1">
                    <button disabled={!!busy} onClick={() => act("/api/admin/serials", s.id, "confirm")} className="rounded-lg bg-emerald-700 px-2.5 py-1.5 text-[11px] font-bold text-white disabled:opacity-50">নিশ্চিত</button>
                    <button disabled={!!busy} onClick={() => act("/api/admin/serials", s.id, "cancel")} className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-[11px] font-bold text-gray-600 disabled:opacity-50">বাতিল</button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div>
        <h3 className="text-sm font-bold">🩺 প্রোফাইল দাবি ({claims.filter((c) => c.status === "PENDING").length} বাকি)</h3>
        {claims.filter((c) => c.status === "PENDING").length === 0 ? (
          <p className="mt-2 text-xs text-gray-500">কোনো দাবি নেই।</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-1.5">
            {claims.filter((c) => c.status === "PENDING").slice(0, 20).map((c) => (
              <li key={c.id} className="rounded-xl border border-gray-100 px-3 py-2 text-[13px]">
                <p>
                  <b>{c.claimant_name}</b> <a href={`tel:${c.claimant_phone}`} className="font-semibold text-emerald-700">{c.claimant_phone}</a>
                  {" "}→ <Link href={`/doctor/${c.doctor_id}`} className="font-bold text-emerald-800">{c.doctor_name || c.doctor_id.slice(0, 8)}</Link>
                </p>
                {c.note && <p className="mt-0.5 text-xs text-gray-600">“{c.note}”</p>}
                <p className="mt-0.5 text-[11px] text-gray-500">ফোনে BMDC/পরিচয় যাচাই করে Approve চাপুন।</p>
                <div className="mt-1.5 flex gap-1">
                  <button disabled={!!busy} onClick={() => act("/api/admin/claims", c.id, "approve")} className="rounded-lg bg-sky-700 px-2.5 py-1.5 text-[11px] font-bold text-white disabled:opacity-50">যাচাই করে দিন ✓</button>
                  <button disabled={!!busy} onClick={() => act("/api/admin/claims", c.id, "reject")} className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-[11px] font-bold text-gray-600 disabled:opacity-50">খারিজ</button>
                </div>
                {editLinks[c.id] && (
                  <p className="mt-1.5 break-all rounded-lg bg-sky-50 px-2.5 py-1.5 text-[11px]">
                    ✏️ সেলফ-এডিট লিংক (ডাক্তারকে পাঠান): <b>{editLinks[c.id]}</b>
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      {msg && <p className="text-xs font-bold">{msg}</p>}
      {notifs.length > 0 && (
        <div>
          <h3 className="text-sm font-bold">✉️ নোটিফিকেশন সারি (SMS/WhatsApp env বসালে স্বয়ংক্রিয় যাবে)</h3>
          <ul className="mt-2 flex flex-col gap-1">
            {notifs.slice(0, 10).map((n) => (
              <li key={n.id} className="rounded-lg border border-gray-100 px-2.5 py-1.5 text-xs">
                <b>{n.channel}</b> → {n.to_phone} • {n.status}
                {n.error && <span className="text-amber-700"> • {n.error}</span>}
                <span className="block truncate text-gray-500">{n.body}</span>
                {n.status !== "SENT" && (
                  <button disabled={!!busy} onClick={() => retryNotif(n.id)} className="mt-1 rounded-lg border border-emerald-700 px-2 py-1 text-[11px] font-bold text-emerald-800">
                    আবার পাঠান
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
