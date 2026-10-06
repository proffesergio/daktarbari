"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Row = { id: string; name_bn: string; specialty_bn: string; location_district: string; location_upazila_area: string; appointment_contact: string; status: string; reports: number };

export default function AdminTable({ rows }: { rows: Row[] }) {
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");
  const router = useRouter();

  async function act(path: string, id: string) {
    setBusy(id + path);
    setMsg("");
    try {
      const res = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      const j = await res.json().catch(() => ({}));
      setMsg(res.ok ? "✅ সফল" : `❌ ${j.error ?? "ব্যর্থ"}`);
      if (res.ok) router.refresh();
    } catch {
      setMsg("❌ নেটওয়ার্ক সমস্যা");
    }
    setBusy("");
  }

  if (rows.length === 0) return <p className="mt-3 text-xl">কোনো তথ্য নেই।</p>;

  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full min-w-[640px] border-2 text-lg">
        <thead><tr className="bg-gray-100"><th className="p-2 text-left">নাম</th><th className="p-2">জেলা/এলাকা</th><th className="p-2">স্ট্যাটাস</th><th className="p-2">অ্যাকশন</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t">
              <td className="p-2 font-bold">{r.name_bn}<br /><span className="font-normal text-gray-600">{r.specialty_bn} • {r.appointment_contact}</span></td>
              <td className="p-2 text-center">{r.location_district}/{r.location_upazila_area}{r.reports > 0 && <span className="ml-1 text-red-600">⚑{r.reports}</span>}</td>
              <td className="p-2 text-center font-bold">{r.status}</td>
              <td className="p-2">
                <div className="flex gap-2">
                  <button disabled={!!busy} onClick={() => act("/api/admin/approve", r.id)} className="rounded-lg bg-emerald-700 px-3 py-2 font-bold text-white">Approve</button>
                  <button disabled={!!busy} onClick={() => act("/api/admin/reject", r.id)} className="rounded-lg border-2 px-3 py-2 font-bold">Reject</button>
                  <button disabled={!!busy} onClick={() => { if (confirm("মুছে ফেলবেন?")) act("/api/admin/delete", r.id); }} className="rounded-lg border-2 border-red-300 px-3 py-2 font-bold text-red-700">Delete</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {msg && <p className="mt-2 text-lg font-bold">{msg}</p>}
    </div>
  );
}
