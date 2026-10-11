"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export type AdminReview = {
  id: string;
  doctor_id: string;
  rating: number;
  comment: string;
  patient_name: string;
  status: string;
  ip_hash?: string;
  created_at: string;
  doctor_name?: string;
};

// Review moderation queue.
export default function AdminReviews({ rows }: { rows: AdminReview[] }) {
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");
  const router = useRouter();
  const pend = rows.filter((r) => r.status === "PENDING");
  // Spam signal: same IP flooding pending reviews
  const ipCounts = new Map<string, number>();
  for (const r of pend) {
    if (r.ip_hash) ipCounts.set(r.ip_hash, (ipCounts.get(r.ip_hash) ?? 0) + 1);
  }
  const spammers = [...ipCounts.entries()].filter(([, n]) => n >= 3);

  async function act(id: string, action: "approve" | "reject") {
    setBusy(id + action);
    setMsg("");
    try {
      const res = await fetch("/api/admin/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok) {
        setMsg("✅ সম্পন্ন");
        router.refresh();
      } else setMsg(`❌ ${j.error ?? "ব্যর্থ"}`);
    } catch {
      setMsg("❌ নেটওয়ার্ক সমস্যা");
    }
    setBusy("");
  }

  async function rejectIp(ip_hash: string) {
    if (!confirm("এই IP-এর সব বাকি রিভিউ খারিজ করবেন?")) return;
    setBusy(ip_hash);
    try {
      const res = await fetch("/api/admin/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject_ip", ip_hash }),
      });
      const j = await res.json().catch(() => ({}));
      setMsg(res.ok ? `✅ ${j.rejected ?? 0}টি খারিজ` : `❌ ${j.error ?? "ব্যর্থ"}`);
      if (res.ok) router.refresh();
    } catch {
      setMsg("❌ নেটওয়ার্ক সমস্যা");
    }
    setBusy("");
  }

  if (!pend.length)
    return <p className="text-sm text-gray-500">মডারেশন বাকি নেই ({rows.length}টি নিষ্পন্ন)।</p>;

  return (
    <div>
      <p className="text-[11px] text-gray-500">{pend.length}টি রিভিউ যাচাই বাকি — Approve করলে প্রোফাইলে দেখা যাবে।</p>
      {spammers.length > 0 && (
        <div className="mt-2 rounded-xl border border-red-200 bg-red-50/60 p-2.5">
          <p className="text-xs font-bold text-red-800">⚠ সম্ভাব্য স্প্যাম — একই উৎস থেকে একাধিক রিভিউ</p>
          {spammers.map(([ip, n]) => (
            <div key={ip} className="mt-1 flex items-center gap-2 text-xs">
              <span className="font-mono">{ip.slice(0, 8)}… ×{n}</span>
              <button disabled={!!busy} onClick={() => rejectIp(ip)} className="rounded-lg bg-red-600 px-2 py-1 text-[11px] font-bold text-white">সব খারিজ</button>
            </div>
          ))}
        </div>
      )}
      <ul className="mt-2 flex flex-col gap-1.5">
        {pend.slice(0, 30).map((r) => (
          <li key={r.id} className="rounded-xl border border-gray-100 px-3 py-2 text-[13px]">
            <p>
              <span className="font-bold text-amber-600">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>{" "}
              <Link href={`/doctor/${r.doctor_id}`} className="font-bold text-emerald-800">{r.doctor_name || r.doctor_id.slice(0, 8)}</Link>
            </p>
            {r.comment && <p className="mt-0.5 text-gray-700">“{r.comment}”</p>}
            {r.patient_name && <p className="mt-0.5 text-[11px] text-gray-500">— {r.patient_name}</p>}
            <div className="mt-1.5 flex gap-1">
              <button disabled={!!busy} onClick={() => act(r.id, "approve")} className="rounded-lg bg-emerald-700 px-2.5 py-1.5 text-[11px] font-bold text-white disabled:opacity-50">প্রকাশ</button>
              <button disabled={!!busy} onClick={() => act(r.id, "reject")} className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-[11px] font-bold text-gray-600 disabled:opacity-50">খারিজ</button>
            </div>
          </li>
        ))}
      </ul>
      {msg && <p className="mt-2 text-xs font-bold">{msg}</p>}
    </div>
  );
}
